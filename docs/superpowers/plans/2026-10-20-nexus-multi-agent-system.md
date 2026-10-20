# Nexus Multi-Agent System Implementation Plan (Python Edition)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Nexus, a Python-based CLI multi-agent orchestration runtime featuring an App Store worker registry, shared memory blackboard, resilient failover router, and a trust layer with sandboxed self-healing code execution and Ed25519 cryptographic receipts.

**Architecture:** Asyncio runtime with an in-memory thread-safe pub/sub blackboard (`asyncio.Lock` + `asyncio.Queue`). Tasks are decomposed into DAG subtasks by the Router and dispatched to matched agents registered in the App Store. Untrusted agent outputs run in Bubblewrap (`bwrap`) Linux namespace sandboxes with automated retry loops on failures, and all outputs are verified with Ed25519 signatures.

**Tech Stack:** Python 3.11+, Asyncio, Pydantic v2, Click, Cryptography (Ed25519), Httpx, Pytest, Pytest-asyncio.

**Spec:** `docs/superpowers/specs/2026-10-20-nexus-multi-agent-system-design.md`

## Global Constraints
- Target package directory: `nexus/`
- All errors inherit from `NexusError` in `nexus/error.py`
- Sandbox runner defaults to `bwrap` with unconfined fallback
- Cryptographic signatures use standard Ed25519 keys
- No AI attribution lines in any commits or PRs

---

### Task 1: Project Scaffolding & Core Error Types

**Files:**
- Create: `nexus/__init__.py`
- Create: `nexus/error.py`
- Create: `tests/__init__.py`
- Create: `tests/test_scaffolding.py`

**Interfaces:**
- Produces: `NexusError`, `RouterError`, `WorkerError`, `SandboxError`, `SelfHealExhaustedError`, `BlackboardError`, `CryptoError`, `LlmError`.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 2: Shared Memory Blackboard

**Files:**
- Create: `nexus/blackboard/__init__.py`
- Create: `nexus/blackboard/memory.py`
- Create: `nexus/blackboard/events.py`
- Test: `tests/test_blackboard.py`

**Interfaces:**
- Produces: `Blackboard`, `BlackboardEntry`, `BlackboardEvent`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 3: Worker App Store & Registry

**Files:**
- Create: `nexus/app_store/__init__.py`
- Create: `nexus/app_store/manifest.py`
- Create: `nexus/app_store/registry.py`
- Test: `tests/test_app_store.py`

**Interfaces:**
- Produces: `AgentManifest`, `AppStore`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 4: LLM Client & Mock Test Backend

**Files:**
- Create: `nexus/llm/__init__.py`
- Create: `nexus/llm/base.py`
- Create: `nexus/llm/mock.py`
- Create: `nexus/llm/api.py`
- Test: `tests/test_llm.py`

**Interfaces:**
- Produces: `LlmClient`, `MockLlmClient`, `ApiLlmClient`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 5: Worker Agents (Coding, Research, Data, Ops)

**Files:**
- Create: `nexus/agents/__init__.py`
- Create: `nexus/agents/base.py`
- Create: `nexus/agents/coding.py`
- Create: `nexus/agents/research.py`
- Create: `nexus/agents/data.py`
- Create: `nexus/agents/ops.py`
- Test: `tests/test_agents.py`

**Interfaces:**
- Produces: `Agent`, `AgentOutput`, `CodingAgent`, `ResearchAgent`, `DataAgent`, `OpsAgent`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 6: Trust Layer - Cryptographic Receipts

**Files:**
- Create: `nexus/trust/__init__.py`
- Create: `nexus/trust/receipt.py`
- Test: `tests/test_receipt.py`

**Interfaces:**
- Produces: `ReceiptSigner`, `SignedReceipt`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 7: Trust Layer - Sandbox Runner & Self-Healing Loop

**Files:**
- Create: `nexus/trust/sandbox.py`
- Create: `nexus/trust/healer.py`
- Test: `tests/test_sandbox_healer.py`

**Interfaces:**
- Produces: `SandboxRunner`, `SandboxResult`, `SelfHealer`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 8: Router Planner & Failover Supervisor

**Files:**
- Create: `nexus/router/__init__.py`
- Create: `nexus/router/planner.py`
- Create: `nexus/router/supervisor.py`
- Test: `tests/test_router.py`

**Interfaces:**
- Produces: `Subtask`, `TaskPlanner`, `RouterSupervisor`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 9: CLI Interface & End-to-End Orchestration

**Files:**
- Create: `nexus/cli.py`
- Test: `tests/test_e2e_cli.py`

**Interfaces:**
- Produces: CLI commands `run`, `list-agents`, `verify-receipt`.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
