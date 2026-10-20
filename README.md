# 🌐 Nexus: Autonomous Multi-Agent Orchestration Hub

[![CI](https://github.com/vinay3254/nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/vinay3254/nexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)

Nexus is an enterprise-grade, resilient runtime and orchestration engine for specialized AI worker agents, built in Python with Asyncio. It eliminates redundant compute, isolates untrusted code in Linux sandboxes, provides automated self-healing loops upon failures, and generates verifiable cryptographic receipts for every execution.

---

## ⚡ Core Pillars

* **🏪 An "App Store" for AI Workers:** Nexus lets completely different AI agents plug into a central hub, discover each other's specialized skills via capability manifests, and pass chores back and forth automatically. Supports runtime dynamic plugins from external `.py` files.
* **📋 Shared Memory Blackboard:** All agents read from and write to a single live digital notebook with async pub/sub event broadcasting and optional SQLite WAL persistence, stopping agents from wasting compute and API budget repeating each other's work.
* **🛡️ Self-Healing Security Guard:** Untrusted agent code is isolated inside a secure virtual container sandbox (`bwrap`). If code crashes or fails, the hub catches the error trace and forces agents to rewrite it until it works cleanly.
* **🔏 Cryptographic Trust Layer:** Every final artifact, execution telemetry, and output payload is hashed with SHA-256 and signed with Ed25519 asymmetric keys, producing tamper-evident digital receipts.
* **🖥️ Realtime Web Dashboard & Daemon:** Built-in FastAPI WebSocket server with a dark-mode glassmorphism dashboard streaming live agent telemetry, task states, blackboard mutations, and cryptographic receipts.
* **🤖 Multi-LLM Provider Auto-Discovery:** Seamless auto-detection and execution across Anthropic Claude (`CLAUDE_API_KEY` / `ANTHROPIC_API_KEY`), local Ollama (`localhost:11434`), OpenAI (`OPENAI_API_KEY`), or offline deterministic Mock LLM.

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
  ║                     Shared Memory Blackboard (RAM + SQLite WAL)                         ║
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
| **Shared Memory** | **`asyncio.Lock` + `asyncio.Queue` + `aiosqlite`** | Live in-memory digital notebook with revision histories and optional WAL persistence. |
| **Data Validation** | **Pydantic v2** | Strict schema validation for agent manifests, subtasks, and execution receipts. |
| **Terminal UI** | **Rich & Click** | High-aesthetic terminal output with styled tables, tree graphs, panels, and syntax styling. |
| **Sandbox Isolation** | **Bubblewrap (`bwrap`)** | Unprivileged Linux containerization using user/mount/pid/net namespaces. |
| **Self-Healing Engine** | **Iterative LLM Refinement** | Real-time stderr capture, stack-trace feedback loop, automated code repair with retry limits. |
| **Cryptographic Trust** | **Cryptography (`Ed25519`) & SHA-256** | High-speed asymmetric signing, tamper-proof execution receipts, standalone verification. |
| **Web Dashboard** | **FastAPI + WebSockets + HTML5/Tailwind** | Realtime browser dashboard monitoring live agent execution and blackboard state. |
| **LLM Driver** | **Pluggable Multi-Provider** | Auto-discovers Anthropic, Ollama, OpenAI, or falls back to offline Mock LLM. |

---

## 🚀 CLI Interface & Quickstart

### Installation

```bash
git clone https://github.com/vinay3254/nexus.git
cd nexus
uv sync
```

### Usage Examples

#### 1. Interactive Capability Showcases (`nexus demo`)
Run pre-configured showcase scenarios demonstrating Nexus features:
```bash
# 1. Self-Healing Security Guard in action
uv run nexus demo --scenario self-heal

# 2. Multi-agent distributed task execution
uv run nexus demo --scenario orchestration

# 3. Dynamic App Store agent matching
uv run nexus demo --scenario app-store
```

#### 2. Launch Realtime Web Dashboard (`nexus serve`)
```bash
uv run nexus serve --port 8000 --persist blackboard.db
```
Open `http://localhost:8000` to access the live dashboard with WebSocket telemetry.

#### 3. List Registered App Store Agents
```bash
uv run nexus list-agents
```

#### 4. Execute a Multi-Agent Task
```bash
uv run nexus run "Clean csv data, extract trends, and write forecast script" \
  --provider auto \
  --persist ./blackboard.db \
  --export-receipt ./receipt.json
```

#### 5. Inspect Plan without Executing (Dry Run)
```bash
uv run nexus run "Analyze sales and write deployment script" --dry-run
```

#### 6. Cryptographically Verify an Execution Receipt
```bash
uv run nexus verify-receipt ./receipt.json
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
│   ├── cli.py                   # Click CLI with rich terminal formatting
│   ├── error.py                 # Centralized exception types
│   ├── app_store/               # Worker registry & capability discovery
│   ├── blackboard/              # Shared memory notebook & pub/sub events
│   ├── persistence/             # SQLite WAL asynchronous persistence store
│   ├── router/                  # Task decomposition & failover supervisor
│   ├── agents/                  # Specialized worker agents (Coding, Research, Data, Ops)
│   ├── plugins/                 # Dynamic plugin discovery and loader
│   ├── trust/                   # Bubblewrap sandbox, self-healing loop & Ed25519 receipts
│   ├── llm/                     # Multi-provider LLM engine (Anthropic, Ollama, OpenAI, Mock)
│   ├── ui/                      # Rich terminal visualizers
│   ├── server/                  # FastAPI web server and realtime WebSocket dashboard
│   └── demo/                    # Interactive showcase scenarios
├── tests/                       # Complete unit, integration, and E2E test suites
├── pyproject.toml               # Python project configuration (uv / hatchling)
└── README.md                    # Project documentation
```

---

## 🤝 Contributing & License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
