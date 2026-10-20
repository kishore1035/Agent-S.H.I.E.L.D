# Nexus Multi-Agent System - Architecture & Design Specification

- **Date:** 2026-10-20
- **Status:** Approved
- **Target Implementation:** Rust (Tokio, Clap, Ed25519-dalek, Bubblewrap)

---

## 1. Executive Summary

Nexus is an orchestration platform and runtime for specialized AI worker agents. It provides:
1. **Worker App Store (Registry):** Plug-and-play capability catalog for discovering and invoking specialized agents.
2. **Shared Memory Blackboard:** A live, thread-safe digital notebook with pub/sub event broadcasting, preventing redundant computation.
3. **Resilient Router & Supervisor:** Dynamic task decomposition, capability-based routing, and automatic failover when agents crash or time out.
4. **Trust Layer & Self-Healing Sandbox:** Sandboxed code execution using Linux namespaces (`bwrap`), automated retry loops on failures, and Ed25519 cryptographic receipts for verified outputs.

---

## 2. System Architecture

```
                       [CLI User Task]
                              │
                              ▼
                       [Router Planner] ◄──(Queries)──► [App Store Registry]
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
            [Subtask 1]              [Subtask 2]
                  │                       │
                  ▼                       ▼
         [Router Supervisor]     [Router Supervisor]
                  │                       │
      (Agent dies? Re-route)  (Agent dies? Re-route)
                  │                       │
                  ├───────────────────────┤
                  │                       │
                  ▼                       ▼
          [Coding Agent]           [Research Agent]
                  ▲                       ▲
                  │                       │
                  ▼                       ▼
          ┌───────────────────────────────────────┐
          │      Shared Memory Blackboard         │
          │  (Arc<RwLock>, pub/sub events)        │
          └───────────────────────────────────────┘
                              │
                              ▼
                       [Trust Layer]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [bwrap Sandbox]             [Self-Healing Loop]
               │                             ▲
               ├── Error / Non-zero Exit ────┘
               ▼
       [Receipt Signer] (Ed25519)
               │
               ▼
        [Merged Result]
```

---

## 3. Component Specifications

### 3.1 App Store & Worker Registry (`src/app_store/`)
- **`AgentManifest`**:
  - `id`: Unique agent slug (e.g., `"coding-agent-v1"`).
  - `name`: Display name.
  - `capabilities`: Set of supported tags (`["code-generation", "code-fixing", "python", "rust"]`).
  - `version`: Semantic version string.
  - `timeout_secs`: Execution timeout cap.
- **`Registry`**:
  - In-memory catalog of registered agent implementations.
  - Scoring function matching subtask requirement tags against agent capabilities.
  - Supports dynamic registration of custom or user-provided agent configurations.

### 3.2 Shared Memory Blackboard (`src/blackboard/`)
- **Storage Model**:
  - `Arc<RwLock<Blackboard>>` containing key-value entries.
  - Each entry has: `key: String`, `value: serde_json::Value`, `author: String`, `version: u64`, `timestamp: chrono::DateTime<Utc>`.
- **Pub/Sub Notification**:
  - `tokio::sync::broadcast::Sender<BlackboardEvent>` notifies all active agents when entries are created, updated, or finalized.
  - Workers inspect blackboard prior to running queries or tasks to reuse existing findings.

### 3.3 Router & Supervisor (`src/router/`)
- **Planner**:
  - Accepts top-level user task.
  - Decomposes task into a directed acyclic graph (DAG) of `Subtask` nodes with dependency edges.
  - Uses capability scoring to select best agent for each node.
- **Supervisor**:
  - Manages worker execution lifecycles with `tokio::spawn` and `tokio::time::timeout`.
  - Heartbeat and status tracking (`Pending`, `Running`, `Completed`, `Failed`).
  - **Failover Logic**: If worker times out or panics, the supervisor marks the worker offline, logs failure to blackboard, and re-dispatches the subtask to the next highest-scoring alternative agent.

### 3.4 Trust Layer & Self-Healing Sandbox (`src/trust/`)
- **Sandbox Runner (`bwrap`)**:
  - Executes untrusted code artifacts in isolated Linux namespaces.
  - Configured with:
    - Read-only root mount (`--ro-bind / /`).
    - Ephemeral tmpfs (`--tmpfs /tmp`).
    - Unshared namespaces (`--unshare-all`).
    - Network disabled by default (`--unshare-net`).
    - Hard CPU time and memory limits.
  - Non-Linux / missing-`bwrap` fallback: restricted subprocess runner with warnings.
- **Self-Healing Loop**:
  - Intercepts non-zero exit codes, runtime panics, or stderr outputs.
  - Formulates error feedback context and re-prompts the worker agent to diagnose and regenerate fixed code.
  - Configurable maximum retries (default: 3). Fails gracefully if attempts are exhausted.
- **Cryptographic Receipts (`receipt.rs`)**:
  - Computes SHA-256 digest over task input, final code/output, execution metadata, and sandbox telemetry.
  - Signs digest with host Ed25519 keypair.
  - Produces standalone `SignedReceipt` JSON containing signature, public key, and timestamp for downstream auditability.

### 3.5 LLM Engine Abstraction (`src/llm/`)
- **`LlmClient` Trait**:
  - Async method `complete(prompt: &str, system: Option<&str>) -> Result<String, LlmError>`.
- **Implementations**:
  - `ApiLlmClient`: HTTP client compatible with Anthropic and OpenAI-compatible API schemas.
  - `MockLlmClient`: Deterministic pattern-matching driver for testing, CI, and offline execution without API keys.

---

## 4. CLI Interface (`src/main.rs`)

Built with `clap` (derive interface):

```bash
# Run a task through Nexus
nexus run "Analyze data.csv and generate summary report" \
  [--mock-llm] \
  [--sandbox-retries 3] \
  [--export-receipt ./receipt.json] \
  [--dry-run]

# List all available agents in App Store
nexus list-agents

# Cryptographically verify an execution receipt
nexus verify-receipt ./receipt.json
```

---

## 5. Error Handling & Recovery Matrix

| Scenario | Detection | Recovery Action |
|----------|-----------|-----------------|
| Agent panics or times out | Supervisor task join failure or elapsed timeout | Mark agent failed; re-route subtask to fallback agent |
| Sandboxed code crashes | `bwrap` exit code != 0 or stderr present | Self-healing loop: feed stderr back to agent, re-generate code (up to N retries) |
| Retries exhausted | Loop counter exceeds `sandbox_retries` | Mark task failed, record error on blackboard, emit error receipt |
| Host lacks `bwrap` | Executable lookup fails | Warn user; run in unconfined subprocess mode with explicit user flag |
| Blackboard concurrency | Read/write lock contention | Non-blocking try-read/write with async retry backoff |

---

## 6. Testing Strategy

1. **Unit Tests**:
   - `test_registry_capability_scoring`: Validate agent selection ranking.
   - `test_blackboard_concurrency_and_pubsub`: Verify concurrent read/write and event delivery.
   - `test_ed25519_receipt_sign_and_verify`: Ensure signature verification succeeds on untampered receipts and fails on tampered data.
   - `test_task_dag_dependency_resolution`: Verify subtasks execute in valid topological order.
2. **Integration Tests**:
   - `test_e2e_mock_workflow`: Complete task execution using `MockLlmClient` from CLI to merged output.
   - `test_supervisor_agent_failover`: Deliberate agent panic triggers re-route to secondary agent.
   - `test_self_healing_sandbox_retry`: Faulty script generates crash, self-healing loop corrects code on retry 2.
