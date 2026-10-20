# Nexus Multi-Agent System - Architecture & Design Specification

- **Date:** 2026-10-20
- **Status:** Approved
- **Target Implementation:** Python (Asyncio, Pydantic, Click, Cryptography, Bubblewrap)

---

## 1. Executive Summary

Nexus is an orchestration platform and runtime for specialized AI worker agents. It provides:
1. **Worker App Store (Registry):** Plug-and-play capability catalog for discovering and invoking specialized agents.
2. **Shared Memory Blackboard:** A live, async-safe digital notebook with pub/sub event broadcasting, preventing redundant computation.
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
          │  (asyncio.Lock, pub/sub queues)       │
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

### 3.1 App Store & Worker Registry (`nexus/app_store/`)
- **`AgentManifest` (Pydantic)**:
  - `id`: Unique agent slug (e.g., `"coding-agent"`).
  - `name`: Display name.
  - `capabilities`: List of supported tags (`["code", "python", "fix"]`).
  - `version`: Semantic version string.
  - `timeout_secs`: Execution timeout cap.
- **`AppStore`**:
  - In-memory catalog of registered agent implementations.
  - Scoring function matching subtask requirement tags against agent capabilities.

### 3.2 Shared Memory Blackboard (`nexus/blackboard/`)
- **Storage Model**:
  - Thread/async-safe dictionary guarded by `asyncio.Lock`.
  - Entries have: `key: str`, `value: Any`, `author: str`, `version: int`, `timestamp: datetime`.
- **Pub/Sub Notification**:
  - Asynchronous event bus distributing `BlackboardEvent` across subscribed worker queues.

### 3.3 Router & Supervisor (`nexus/router/`)
- **Planner**:
  - Accepts top-level user task.
  - Decomposes task into a directed acyclic graph (DAG) of `Subtask` items.
- **Supervisor**:
  - Manages worker execution lifecycles with `asyncio.wait_for`.
  - Detects timeouts or exceptions and triggers automatic failover to fallback agents.

### 3.4 Trust Layer & Self-Healing Sandbox (`nexus/trust/`)
- **Sandbox Runner (`bwrap`)**:
  - Executes untrusted code artifacts in isolated Linux namespaces (`bwrap --ro-bind / / --tmpfs /tmp --unshare-all`).
  - Fallback unconfined mode when bwrap is absent or explicitly flagged.
- **Self-Healing Loop**:
  - Intercepts non-zero exit codes, runtime panics, or stderr outputs.
  - Feeds error trace back to agent with instructions to repair code (up to N retries).
- **Cryptographic Receipts (`receipt.py`)**:
  - Computes SHA-256 digest over task input, final code/output, and metadata.
  - Signs digest with Ed25519 private key via `cryptography.hazmat.primitives.asymmetric.ed25519`.
  - Produces standalone `SignedReceipt` for verification.

### 3.5 LLM Engine Abstraction (`nexus/llm/`)
- **`LlmClient` Base**:
  - Abstract method `async def complete(prompt: str, system: str | None = None) -> str`.
- **Implementations**:
  - `ApiLlmClient`: HTTP client compatible with Anthropic and OpenAI-compatible API schemas.
  - `MockLlmClient`: Deterministic pattern-matching driver for offline tests.
