# 🌐 Nexus: Autonomous Multi-Agent Orchestration Hub

[![CI](https://github.com/vinay3254/nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/vinay3254/nexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)

Nexus is an enterprise-grade, resilient runtime and orchestration engine for specialized AI worker agents, built in Python with Asyncio. It eliminates redundant compute, isolates untrusted code in Linux sandboxes, provides automated self-healing loops upon failures, and generates verifiable cryptographic receipts for every execution.

---

## ⚡ Core Pillars

* **🏪 An "App Store" for AI Workers:** Nexus lets completely different AI agents plug into a central hub, discover each other's specialized skills via capability manifests, and pass chores back and forth automatically.
* **📋 Shared Memory Blackboard:** All agents read from and write to a single live digital notebook with pub/sub event broadcasting, stopping agents from wasting compute and API budget repeating each other's work.
* **🛡️ Self-Healing Security Guard:** Untrusted agent code is isolated inside a secure virtual container sandbox (`bwrap`). If code crashes or fails, the hub catches the error trace and forces agents to rewrite it until it works cleanly.
* **🔏 Cryptographic Trust Layer:** Every final artifact, execution telemetry, and output payload is hashed with SHA-256 and signed with Ed25519 asymmetric keys, producing tamper-evident digital receipts.

---

## 🏗️ System Architecture

```
                       ┌──────────────────────┐
                       │      Your Task       │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐      ┌────────────────────┐
                       │        Router        │ ◄────┤    Agent dies?     │
                       │ Splits task, picks   │      │   Job re-routed    │
                       │     best agent       │      └────────────────────┘
                       └──────────┬───────────┘
                                  │
         ┌────────────────────────┼────────────────────────┬────────────────────────┐
         │                        │                        │                        │
         ▼                        ▼                        ▼                        ▼
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │ Coding Agent │         │Research Agent│         │  Data Agent  │         │  Ops Agent   │
  └──────┬───────┘         └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
         │                        │                        │                        │
  ═══════╪════════════════════════╪════════════════════════╪════════════════════════╪════════
  ║      └────────────────────────┴───────────┬────────────┴────────────────────────┘       ║
  ║                                           ▼                                             ║
  ║                            Shared Memory Blackboard                                     ║
  ║                     (Thread-safe asyncio pub/sub notifications)                         ║
  ════════════════════════════════════════════╤═════════════════════════════════════════════
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │     Trust Layer      │
                                   │    Sandbox output,   │
                                   │     sign receipts    │
                                   └──────────┬───────────┘
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │    Merged Result     │
                                   └──────────────────────┘
```

---

## 🛠️ Tech Stack & Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Core Runtime** | **Python 3.11+** | Rich AI agent ecosystem, rapid iteration, dynamic extensibility. |
| **Async Engine** | **`asyncio`** | High-performance asynchronous event loop, concurrent agent coroutines. |
| **Shared Memory** | **`asyncio.Lock` + `asyncio.Queue` pub/sub** | Live in-memory digital notebook with versioned revisions and change event broadcasting. |
| **Data Validation** | **Pydantic v2** | Strict schema validation for agent manifests, subtasks, and execution receipts. |
| **CLI Framework** | **Click** | Composable, elegant command line interface with subcommands and flags. |
| **Sandbox Isolation** | **Bubblewrap (`bwrap`)** | Unprivileged Linux containerization using user/mount/pid/net namespaces. |
| **Self-Healing Engine** | **Iterative LLM Refinement** | Real-time stderr capture, stack-trace feedback loop, automated code repair with retry limits. |
| **Cryptographic Trust** | **Cryptography (`Ed25519`) & SHA-256** | High-speed asymmetric signing, tamper-proof execution receipts, standalone verification. |
| **LLM Driver** | **Pluggable (Live API + Mock)** | Supports both Anthropic / OpenAI HTTP endpoints and offline deterministic test mocks. |

---

## 🔄 How It Works: Step-by-Step

### 1. Task Decomposition & Routing
When a task arrives (e.g., `"Analyze financial dataset, generate summary charts, and write deployment script"`):
- The **Task Planner** breaks the prompt into a directed acyclic graph (DAG) of specialized subtasks.
- The **Router Supervisor** queries the **App Store Registry** to inspect worker capabilities (`["data", "code", "ops", "research"]`) and selects the highest-scoring candidate for each subtask.
- If an agent crashes or times out during execution, the supervisor detects the failure, updates the blackboard, and immediately re-routes the job to a fallback worker.

### 2. Live Blackboard Synchronization
- Every agent writes intermediate findings, datasets, and hypotheses to the **Blackboard**.
- Other agents listen to blackboard update events asynchronously.
- If the Research Agent has already indexed a library or dataset, the Coding Agent consumes the cached result immediately, cutting token usage and latency.

### 3. Sandboxed Execution & Self-Healing Loop
- When an agent generates code, it is executed inside a sandboxed Linux namespace container via `bwrap`:
  - Read-only root mount (`--ro-bind / /`)
  - Isolated temporary directory (`--tmpfs /tmp`)
  - Unshared network (`--unshare-net`) and isolated PID namespace
- If the script exits with non-zero status or emits a runtime error, the **Trust Layer Self-Healer** intercepts the error trace, feeds the diagnostic back to the agent, and prompts for a surgical fix.
- Retries continue until the code runs cleanly or reaches the max retry cap.

### 4. Cryptographic Proof of Execution
- Once verified, the output payload and metadata are hashed into a SHA-256 digest.
- The **Receipt Signer** signs the digest using a secure Ed25519 private key.
- A standalone `SignedReceipt` JSON is exported, allowing third parties to cryptographically verify output authenticity via `nexus verify-receipt`.

---

## 🚀 CLI Interface & Quickstart

### Prerequisites
- **Python:** 3.11+
- **`uv`:** Fast Python package runner (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Bubblewrap (Linux):** `sudo apt install bubblewrap` or `sudo pacman -S bubblewrap`

### Installation

```bash
git clone https://github.com/vinay3254/nexus.git
cd nexus
uv sync
```

### Usage Examples

#### 1. List Registered App Store Agents
```bash
uv run nexus list-agents
```
*Output:*
```
=== Nexus Worker App Store ===
• [coding-agent] Coding Specialist (v1.0.0) - Capabilities: ['code', 'python', 'fix']
• [research-agent] Research Specialist (v1.0.0) - Capabilities: ['research', 'docs', 'summary']
• [data-agent] Data Specialist (v1.0.0) - Capabilities: ['data', 'csv', 'json', 'transform']
• [ops-agent] Ops Specialist (v1.0.0) - Capabilities: ['ops', 'bash', 'deploy', 'config']
```

#### 2. Execute a Multi-Agent Task
```bash
uv run nexus run "Analyze market data and write a clean python forecast script" \
  --sandbox-retries 3 \
  --export-receipt ./receipt.json
```

#### 3. Inspect Plan without Executing (Dry Run)
```bash
uv run nexus run "Analyze sales and write deployment script" --dry-run
```

#### 4. Cryptographically Verify an Execution Receipt
```bash
uv run nexus verify-receipt ./receipt.json
```
*Output:*
```
✅ Receipt signature is VALID. Signed at: 2026-10-20T20:15:00Z
```

---

## 📂 Repository Structure

```
nexus/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow
├── docs/
│   └── superpowers/
│       ├── specs/               # Architectural & Design specifications
│       └── plans/               # Detailed step-by-step implementation plans
├── nexus/
│   ├── __init__.py              # Package init
│   ├── cli.py                   # CLI entrypoint (click)
│   ├── error.py                 # Centralized exception types
│   ├── app_store/               # Worker registry & capability discovery
│   ├── blackboard/              # Shared memory notebook & pub/sub events
│   ├── router/                  # Task decomposition & failover supervisor
│   ├── agents/                  # Specialized worker agents (Coding, Research, Data, Ops)
│   ├── trust/                   # Bubblewrap sandbox, self-healing loop & Ed25519 receipts
│   └── llm/                     # Pluggable LLM interfaces & offline mock driver
├── tests/                       # Unit & End-to-end integration test suites
├── pyproject.toml               # Python project configuration (uv / hatchling)
└── README.md                    # Project documentation
```

---

## 🤝 Contributing & License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
