# Nexus Python Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace proposed Rust runtime with a working Python CLI that executes bounded, recoverable agent workflows.

**Architecture:** Single local orchestrator; SQLite owns task state and event history. Async workers consume validated DAG inputs; isolated subprocesses execute Python; attempt-checked commits publish artifacts and signed records.

**Tech Stack:** CPython 3.12, uv, asyncio, Pydantic 2, Typer, aiosqlite/SQLite WAL, HTTPX, Bubblewrap/cgroup v2, cryptography, pytest, Ruff, mypy.

**Spec:** `docs/superpowers/specs/2026-10-20-nexus-python-runtime-design.md`.

**Status:** Proposed for review. This plan supersedes the earlier Rust plan. No product implementation occurs during planning.

## Global Constraints

- Work from repository root `/home/vinay/nexus`; Python source goes in `src/nexus/`.
- Preserve existing Rust files and unrelated uncommitted changes.
- CPython 3.12; `requires-python = ">=3.12,<3.13"` initially.
- Resolve dependencies once, commit `uv.lock`, and use `uv sync --frozen` in CI.
- One active orchestrator per state directory; SQLite WAL uses a local filesystem.
- DAG size: 100 tasks, 500 dependency edges.
- Active task attempts: 8. Ready queue: 32 IDs; remaining ready tasks stay in SQLite.
- Provider concurrency: 2 per provider. Provider request rate: 30 starts per rolling 60 seconds per provider.
- Run provider budget: 100 HTTP attempts, including planning, repair, and retries.
- Total task attempts: 3, including initial attempt, failover, and healing.
- HTTP connect / pool timeout: 5 seconds each. HTTP read / write timeout: 30 seconds each.
- Whole HTTP attempt: 45 seconds. Task attempt / run deadline: 120 seconds / 30 minutes.
- Code execution wall time: 30 seconds. Sandbox memory / process cap: 512 MiB / 64 processes.
- Sandbox CPU bandwidth: One CPU equivalent. Captured stdout / stderr: 1 MiB each.
- Provider response body: 1 MiB. Inline task input / artifact: 64 KiB / 10 MiB.
- Per-run artifact budget: 100 MiB. Managed storage budget: 1 GiB; reject admission before exceeding reserved capacity.
- Successful-run retention: 7 days; explicit `prune` only.
- Failed/interrupted runs: Retained until explicit deletion; count against quota.
- Shutdown cleanup allowance: 5 seconds after cancellation.
- Missing sandbox prerequisites fail closed. Test fakes never imply sandbox acceptance.
- Defaults, state transitions, exit codes, and receipt schema follow spec exactly.

## Review Focus

1. Commit interrupted after artifact rename: no false success or permanent orphaned reservation; Task 3.
2. Timeout followed by stale completion: stale attempt cannot publish or overwrite result; Tasks 2 and 7.
3. Provider response keeps trickling bytes: whole-request deadline still expires; Task 5.
4. Child forks and parent gets cancelled: all descendants die; Task 8.
5. Receipt signature valid but artifact absent or signer untrusted: verification fails; Task 10.

## File boundaries and deliverable order

`models.py`, `config.py`, `errors.py`: shared contracts and resolved policy.
`storage/{db,repository,artifacts,recovery}.py`: transactions, files, resume.
`planning/{dag,planner}.py`: explicit graph validation and provider planning.
`agents/{protocol,registry,builtin}.py`: installed workers and immutable inputs.
`providers/{protocol,http,openai_compatible,anthropic,mock}.py`: external model calls.
`runtime/{scheduler,budgets,events,service}.py`: orchestration and composition.
`sandbox/{preflight,launcher,cgroups,runner}.py`: Linux process boundary.
`trust/{keys,receipts}.py`: signing and verification.
`cli.py`: command parsing and rendering only.

Tasks execute sequentially. Individual tasks carry their own red/green cycle; commits contain only that task's files.
Do not dispatch subagents until execution method is chosen.
No implementation bodies are prescribed where interfaces and behavioral tests determine them.

### Task 1: Python package and validated contracts

**Files:** Create `pyproject.toml`, `.python-version`, `src/nexus/__init__.py`, `src/nexus/models.py`, `src/nexus/config.py`, `src/nexus/errors.py`, `tests/python/test_models.py`.
**Interfaces:** Produce `TaskSpec`, `ExecutionPlan`, `TaskContext`, `AgentManifest`, `AgentOutput`, `ArtifactRef`, `ExecutionRecord`, `RunReport`, `RuntimePolicy` from spec.
Use `StrEnum` states; discriminated `TextOutput`/`PythonOutput`; UUID-backed ownership fields.
Produce `NexusError` subclasses `ConfigurationError`, `PlanError`, `StateDirectoryBusy`, `BudgetExceeded`, `StaleAttempt`, `SandboxUnavailable`, `VerificationError`.

- [ ] Write tests rejecting duplicate input fields, unknown model fields, zero concurrency, and oversized inline input; assert `RuntimePolicy().max_active_tasks == 8`.
- [ ] Run `uv run pytest tests/python/test_models.py -q`; expect collection/import failure before package exists.
- [ ] Configure Hatchling, Python constraint, dependency groups, and pytest asyncio mode; implement contracts and validated policy defaults.
- [ ] Run same tests; expect PASS. Generate `uv.lock`; verify `uv sync --frozen`.
- [ ] Commit named package/config/test files and lockfile: `feat: define Python runtime contracts`.

### Task 2: Transactional state store and attempt ownership

**Files:** Create `src/nexus/storage/__init__.py`, `db.py`, `repository.py`, `migrations/001_initial.sql`, `tests/python/test_repository.py`.
**Interfaces:** `Repository.open(state_dir: Path) -> Repository` (async factory); async `create_run(plan: ExecutionPlan, policy: RuntimePolicy) -> UUID`; `start_attempt(run_id: UUID, task_id: UUID) -> TaskContext`; `commit_success(context: TaskContext, record: ExecutionRecord, outputs: list[ArtifactRef]) -> None`; `close() -> None`.
Add async `transition_task`, `get_run`, `get_task`, and `events_after(run_id: UUID, sequence: int, limit: int = 100) -> list[EventRecord]`.
Define `RunRow`, `TaskRow`, and `EventRecord` in `repository.py`; these expose IDs, state, policy/deadline, current attempt, event sequence and bounded metadata.

- [ ] Write tests for foreign keys, reopen persistence, exclusive mutating lock, and atomic result/event commits.
- [ ] Write `test_stale_attempt_rejected`: start replacement attempt, commit prior context, expect `StaleAttempt` and unchanged accepted result.
- [ ] Run `uv run pytest tests/python/test_repository.py -q`; expect missing repository failure.
- [ ] Implement migrations and short transaction helpers with transaction lock; configure WAL, FULL sync, foreign keys, and 5-second busy timeout.
- [ ] Re-run tests; expect PASS. Commit Task 2 files: `feat: persist workflow state and attempts`.

### Task 3: Bounded artifact storage and event replay

**Files:** Create `src/nexus/storage/artifacts.py`, `src/nexus/runtime/__init__.py`, `src/nexus/runtime/events.py`, `tests/python/test_artifacts.py`.
**Interfaces:** `ArtifactStore.put(context: TaskContext, data: bytes, media_type: str) -> ArtifactRef`; `read(ref: ArtifactRef) -> bytes`; `import_input(run_id: UUID, path: Path) -> ArtifactRef`; `prune(older_than_days: int) -> int` (all async).
Use UUID-zero task/attempt ownership only for run input imports; document this distinguished owner in ArtifactRef validation.
`EventReader.catch_up(run_id: UUID, after: int) -> list[EventRecord]` calls persisted event paging.

- [ ] Write tests for SHA-256 roundtrip, 10 MiB artifact cap, 100 MiB run quota, 1 GiB managed quota, and refusal to follow symlinks.
- [ ] Inject failure between rename and metadata commit; assert no successful task and orphan cleanup after reopen.
- [ ] Drop every wake notification; assert persisted event catch-up returns complete ordered event sequence.
- [ ] Run `uv run pytest tests/python/test_artifacts.py -q`; expect missing API failure.
- [ ] Implement fsync/rename publication, quota reservations, path validation, paged catch-up, and lock-protected pruning; release unused terminal-run reservations.
- [ ] Re-run tests; expect PASS. Commit Task 3 files: `feat: bound artifact storage and replay events`.

### Task 4: DAG validation and installed worker registry

**Files:** Create `src/nexus/planning/__init__.py`, `dag.py`, `src/nexus/agents/__init__.py`, `protocol.py`, `registry.py`, `tests/python/test_dag.py`, `tests/python/test_registry.py`.
**Interfaces:** `validate_plan(plan: ExecutionPlan) -> ExecutionPlan`; `ready_nodes(plan: ExecutionPlan, states: Mapping[UUID, TaskState]) -> list[UUID]`.
`Agent` Protocol: `manifest: AgentManifest`; async `execute(context: TaskContext, task: TaskSpec) -> AgentOutput`.
`Registry.select(task: TaskSpec, excluded: set[str], active: Mapping[str, int]) -> Agent`.

- [ ] Write DAG tests for cycles, missing dependencies, duplicate IDs, limits, and failed-parent blocking.
- [ ] Write routing tests requiring all mandatory capabilities and stable worker-ID tie-breaking; full workers must not be selected.
- [ ] Run `uv run pytest tests/python/test_dag.py tests/python/test_registry.py -q`; expect missing API failures.
- [ ] Implement graph validation/topological readiness and manifest-to-instance registration; reject duplicate registry IDs.
- [ ] Re-run tests; expect PASS. Commit Task 4 files: `feat: validate DAGs and route capable workers`.

### Task 5: Provider adapters and request budgets

**Files:** Create `src/nexus/providers/__init__.py`, `protocol.py`, `http.py`, `openai_compatible.py`, `anthropic.py`, `mock.py`, `src/nexus/runtime/budgets.py`, `tests/python/test_providers.py`, `tests/python/test_budgets.py`.
**Interfaces:** `LlmRequest` and `LlmResponse` models in `protocol.py`; `LlmClient.complete(request: LlmRequest) -> LlmResponse` async.
`LlmRequest` includes run ID, prompt, optional system message, model, and absolute deadline.
`ProviderError` carries retryable flag, status code, bounded diagnostic, optional retry-after.
`BudgetGate.reserve_request(run_id: UUID, provider: str) -> AsyncContextManager[None]` enforces persisted budget/rate and local concurrency.
Use injectable `Clock` Protocol (`now`, async `sleep`) for deterministic tests.

- [ ] Write MockTransport fixtures for both provider schemas, 401, 429/Retry-After, 503, malformed JSON, redaction, and missing credentials.
- [ ] Assert request 101 raises `BudgetExceeded`, third concurrent request waits, and rolling-window limit survives reopen.
- [ ] Use trickle-stream fixture: whole-request timeout expires despite successful short reads; responses over 1 MiB abort.
- [ ] Run `uv run pytest tests/python/test_providers.py tests/python/test_budgets.py -q`; expect missing API failures.
- [ ] Implement pooled HTTPX clients, explicit adapters, request reservation, and strict response limits; no hidden retries or mock fallback.
- [ ] Re-run tests; expect PASS. Commit Task 5 files: `feat: add budgeted model adapters`.

### Task 6: Structured planning and built-in agents

**Files:** Create `src/nexus/planning/planner.py`, `src/nexus/agents/builtin.py`, `tests/python/test_planner.py`, `tests/python/test_agents.py`.
**Interfaces:** `Planner.decompose(run_id: UUID, prompt: str) -> ExecutionPlan` async; `Planner.load(path: Path) -> ExecutionPlan`.
`CodingAgent`, `ResearchAgent`, `DataAgent`, `OpsAgent` implement Agent.
Planner uses a planning run record before graph creation; add `Repository.create_planning_run(policy) -> UUID` and `attach_plan(run_id, plan) -> None`.
Explicit-plan path can continue using Task 2 `create_run`; both paths share final persisted schema.

- [ ] Write tests for unknown/cyclic planner nodes, one repair maximum, budgeted planning, and deterministic mock plans.
- [ ] Assert report agent receives preceding data output; two same-type tasks cannot share mutable output keys.
- [ ] Assert Ops returns text and unsupported code languages fail validation.
- [ ] Run `uv run pytest tests/python/test_planner.py tests/python/test_agents.py -q`; expect missing API failures.
- [ ] Implement strict structured planning, host UUID remapping, immutable dependency inputs, and builtin outputs.
- [ ] Re-run tests; expect PASS. Commit Task 6 files: `feat: plan workflows and execute builtin agents`.

### Task 7: Bounded scheduler and durable retries

**Files:** Create `src/nexus/runtime/scheduler.py`, `tests/python/test_scheduler.py`; modify repository transition helpers.
**Interfaces:** `Scheduler.run(run_id: UUID) -> RunReport` async.
Define `Executor` Protocol in scheduler: async `execute(agent: Agent, context: TaskContext, task: TaskSpec) -> tuple[ExecutionRecord, list[ArtifactRef]]`.
Use fake Executor until Task 9. Scheduler owns attempt budget; provider adapters never own task retries.

- [ ] Write 100-task fan-out test asserting peak active attempts <=8 and queue size <=32.
- [ ] Test dependency ordering, failed-descendant blocking, independent branch completion, 3-attempt total, and deadline exhaustion.
- [ ] Test cancellation and stale completions; no accepted output after task has been cancelled or replaced.
- [ ] Run `uv run pytest tests/python/test_scheduler.py -q`; expect missing scheduler failure.
- [ ] Implement worker pool, persisted ready/refill queries, typed exception classification, retry_wait timestamps, and aggregate terminal status.
- [ ] Preserve CancelledError propagation after cleanup; ordinary task errors become recorded failures rather than cancelling unrelated branches.
- [ ] Re-run tests; expect PASS. Commit Task 7 files: `feat: schedule bounded recoverable workflows`.

### Task 8: Fail-closed Linux sandbox

**Files:** Create `src/nexus/sandbox/__init__.py`, `preflight.py`, `launcher.py`, `cgroups.py`, `runner.py`, `tests/python/test_sandbox_policy.py`, `tests/python/test_sandbox_linux.py`.
**Interfaces:** `check_sandbox(config: SandboxConfig) -> SandboxCapabilities`; async `SandboxRunner.run(source: ArtifactRef, inputs: list[ArtifactRef], context: TaskContext) -> SandboxResult`.
Define SandboxConfig/Capabilities/Result in `preflight.py`; result contains exit status, bounded streams, limit violation, timing, and enforced policy.
`CgroupController.create(attempt_id: UUID) -> Path`; async `kill_and_wait(path: Path, timeout: float = 5) -> None`.

- [ ] Write policy tests rejecting unavailable cgroups/Bubblewrap; assert root/home/state mounts and inherited secret environment are absent.
- [ ] Write Linux tests for memory cap, process cap, 30-second deadline, 1 MiB output cap, no network, and allowed input access.
- [ ] Write child-fork cancellation test; assert cgroup contains zero processes before return.
- [ ] Run `uv run pytest tests/python/test_sandbox_policy.py -q`; expect missing API failures.
- [ ] Implement separate launcher joining configured cgroup before exec, constrained Bubblewrap invocation, concurrent bounded pipe reads, and cleanup.
- [ ] Run policy suite and `uv run pytest tests/python/test_sandbox_linux.py -q`; require real isolation PASS on provisioned Linux runner.
- [ ] Commit Task 8 files: `feat: enforce sandbox resource isolation`.

### Task 9: Execution pipeline, healing, and restart recovery

**Files:** Create `src/nexus/runtime/service.py`, `src/nexus/storage/recovery.py`, `tests/python/test_execution.py`, `tests/python/test_recovery.py`.
**Interfaces:** `PipelineExecutor` implements Executor; `Recovery.resume(run_id: UUID) -> RunReport` async.
`RuntimeService.run(plan: ExecutionPlan, policy: RuntimePolicy) -> RunReport` composes storage, scheduler, providers, and executor.
RuntimeService also exposes async `run_prompt(prompt: str, policy: RuntimePolicy) -> RunReport` using Task 6 planning records.

- [ ] Write full mock data-to-report workflow test; assert report includes actual upstream data.
- [ ] Fail Python execution once then repair; assert final source/output digests belong to repaired code and total attempts <=3.
- [ ] Kill orchestrator after attempt-start persistence and after artifact rename; resume without rerunning succeeded nodes.
- [ ] Assert recovery reaps recorded cgroups first and preserves request budget/deadline.
- [ ] Run `uv run pytest tests/python/test_execution.py tests/python/test_recovery.py -q`; expect missing pipeline failures.
- [ ] Implement code/text branching, attempt-aware healing context, artifact publication, recovery reconciliation, and ordered terminal aggregation.
- [ ] Re-run tests; expect PASS. Commit Task 9 files: `feat: connect execution and restart recovery`.

### Task 10: Persistent identity and trustworthy receipt verification

**Files:** Create `src/nexus/trust/__init__.py`, `keys.py`, `receipts.py`, `tests/python/test_receipts.py`.
**Interfaces:** `KeyStore.initialize(path: Path) -> str` returns key ID; `ReceiptService.sign(report: RunReport) -> SignedReceipt`; `verify(receipt: SignedReceipt, trust: Mapping[str, bytes], artifacts: Path) -> VerificationReport`.
Define fixed `ReceiptPayload`, `SignedReceipt`, `VerificationReport` in receipts.py; use integer/string fields and explicit schema version.
Sign after report/artifact commit; atomically persist receipt. Signing failure must surface separately and never print verified completion.

- [ ] Write tests for persistent key identity, owner-only permissions, trusted-key roundtrip, changed digest, changed metadata, and untrusted signer.
- [ ] Assert valid signature plus missing artifact returns incomplete verification and CLI-failure status.
- [ ] Assert repeated initialization never replaces existing key; failure records cannot verify as successful runs.
- [ ] Run `uv run pytest tests/python/test_receipts.py -q`; expect missing API failures.
- [ ] Implement cryptography Ed25519 keys, exact deterministic envelope, artifact digest verification, and failure receipts.
- [ ] Re-run tests; expect PASS. Commit Task 10 files: `feat: sign and verify execution records`.

### Task 11: Real CLI and lifecycle commands

**Files:** Create `src/nexus/cli.py`, `src/nexus/__main__.py`, `tests/python/test_cli.py`; modify `pyproject.toml`.
**Interfaces:** `app: typer.Typer`; `main() -> None`; console script `nexus = "nexus.cli:main"`.
Bind spec commands to RuntimeService, Recovery, ArtifactStore, and ReceiptService; CLI contains no orchestration policy.

- [ ] Write subprocess tests for init, doctor, list-agents, explicit/mock runs, dry-run, status, resume, prune, and verify-receipt.
- [ ] Assert successful run executes workers and returns real artifacts; failed task exits 1; bad config exits 2; SIGINT exits 130.
- [ ] Assert real mode without credentials fails and mock mode makes no HTTP calls.
- [ ] Run `uv run pytest tests/python/test_cli.py -q`; expect missing entrypoint failure.
- [ ] Implement CLI commands, JSON response schema, credential validation, signal cleanup, and truthful success messages.
- [ ] Re-run tests; expect PASS. Commit Task 11 files: `feat: expose working orchestration CLI`.

### Task 12: Load evidence, CI gates, and documentation migration

**Files:** Create `src/nexus/runtime/logging.py`, `tests/python/test_logging.py`, `tests/python/test_load.py`, `scripts/benchmark_runtime.py`, `docs/python-runtime-operations.md`; modify `.github/workflows/ci.yml`, `README.md`, `pyproject.toml`.
**Interfaces:** `configure_logging(json_output: bool) -> None`; `benchmark_runtime.py --runs 20 --tasks 100 --output PATH` writes machine-readable measurements.
Use standard-library resource/process metrics and explicit timestamps; distinguish parent and sandbox resource use.

- [ ] Write logging tests requiring run/task/attempt IDs while redacting keys and prompt contents.
- [ ] Write repeated 100-task synthetic-executor load test enforcing active/queued bounds and stable cleanup; no provider calls in this benchmark.
- [ ] Run `uv run pytest tests/python/test_logging.py tests/python/test_load.py -q`; expect missing instrumentation failures.
- [ ] Implement JSON logs and benchmark reporting; measure p95 eligible dispatch, controller RSS, DB latency, queue depth, and retry counts.
- [ ] Update CI to frozen uv installation, Ruff, mypy, pytest, and separate provisioned Linux sandbox job.
- [ ] Sandbox job must fail when prerequisites are unavailable; ordinary portable tests may explicitly skip Linux-only cases.
- [ ] Rewrite README around implemented Python behavior; document setup, cgroup delegation, model credentials, backups, restore, quotas, and known limits.
- [ ] Run `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy src/nexus`, and `uv run pytest tests/python -q`.
- [ ] Run `uv run python scripts/benchmark_runtime.py --runs 20 --tasks 100 --output benchmark-results.json` on documented host.
- [ ] Require provisional <256 MiB controller RSS and <100 ms p95 eligible dispatch; investigate failures before scalability claims.
- [ ] Commit Task 12 source/docs/config files and summarized benchmark evidence: `test: validate runtime reliability and capacity`.

## Final acceptance

- Real CLI executes declared workflow and passes dependency artifacts.
- Mock tests require no credentials or network; both live adapters pass HTTP contract tests.
- Linux sandbox enforcement passes on actual delegated cgroup host.
- Worker crash, SIGINT, restart, stale result, output flood, and storage exhaustion have explicit tested outcomes.
- All state and request limits survive resume; no silent mock or unconfined fallback.
- Trusted receipts bind exact final artifacts; failures never masquerade as success.
- README and CLI claims match measured behavior.
- Distributed deployment remains a separate milestone with its own schema, ownership, auth, and migration design.

## Review handoff

Review local-CLI deployment assumption, Python stack, resource limits, and sandbox host prerequisites before implementation.
Recommended execution method: native, sequential implementation, because storage, scheduler, recovery, and receipt contracts are tightly coupled.
Subagent-driven execution remains an option if independent per-task review is preferred.
This document authorizes no product-code changes by itself.
