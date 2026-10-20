# 🌐 Nexus: Autonomous Multi-Agent Orchestration Hub

[![CI](https://github.com/vinay3254/nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/vinay3254/nexus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Rust: 1.80+](https://img.shields.io/badge/Rust-1.80%2B-orange.svg)](https://www.rust-lang.org/)

Nexus is an enterprise-grade, resilient runtime and orchestration engine for specialized AI worker agents, built from scratch in Rust. It eliminates redundant compute, isolates untrusted code in Linux sandboxes, provides automated self-healing loops upon failures, and generates verifiable cryptographic receipts for every execution.

---

## ⚡ Core Pillars

* **🏪 An "App Store" for AI Workers:** Nexus lets completely different AI agents plug into a central hub, discover each other's specialized skills via capability manifests, and pass chores back and forth automatically.
* **📋 Shared Memory Blackboard:** All agents read from and write to a single live, thread-safe digital notebook (`Arc<RwLock<Blackboard>>`) with pub/sub event broadcasting, stopping agents from wasting compute and API budget repeating each other's work.
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
  ║                     (Arc<RwLock>, pub/sub live notifications)                           ║
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
| **Core Runtime** | **Rust (Edition 2021)** | Zero-cost abstractions, memory safety without GC overhead, fearless concurrency. |
| **Async Engine** | **Tokio 1.40+** | High-performance multi-threaded asynchronous task scheduling and IO primitives. |
| **Shared Memory** | **`Arc<RwLock>` + `broadcast`** | Thread-safe, non-blocking readers, atomic versioned revisions, real-time event distribution. |
| **CLI Framework** | **Clap v4 (Derive)** | Type-safe, declarative CLI arguments, help text, subcommands, and flags. |
| **Sandbox Isolation** | **Bubblewrap (`bwrap`)** | Unprivileged Linux containerization using user/mount/pid/net namespaces without Docker daemon overhead. |
| **Self-Healing Engine** | **Iterative LLM Refinement** | Real-time stderr capture, stack-trace feedback loop, automated code repair with retry limits. |
| **Cryptographic Trust** | **Ed25519-dalek & SHA-256** | High-speed asymmetric signing, tamper-proof execution receipts, zero external trust dependency. |
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
- Other agents listen to `BlackboardEvent::EntryUpdated` over an asynchronous broadcast channel.
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
- **Rust Toolchain:** `rustc` & `cargo` 1.80+ ([Install Rust](https://rustup.rs/))
- **Bubblewrap (Linux):** `sudo apt install bubblewrap` or `sudo pacman -S bubblewrap`
- **Python 3:** For executing Python-based agent code snippets

### Installation

```bash
git clone https://github.com/vinay3254/nexus.git
cd nexus
cargo build --release
```

### Usage Examples

#### 1. List Registered App Store Agents
```bash
./target/release/nexus list-agents
```
*Output:*
```
=== Nexus Worker App Store ===
• [coding-agent] Coding Agent (v1.0.0) - Tags: ["code", "python", "rust", "fix"]
• [research-agent] Research Agent (v1.0.0) - Tags: ["research", "docs", "summary"]
• [data-agent] Data Agent (v1.0.0) - Tags: ["data", "csv", "json", "transform"]
• [ops-agent] Ops Agent (v1.0.0) - Tags: ["ops", "bash", "deploy", "config"]
```

#### 2. Execute a Multi-Agent Task
```bash
./target/release/nexus run "Analyze market data and write a clean python forecast script" \
  --sandbox-retries 3 \
  --export-receipt ./receipt.json
```

#### 3. Inspect Plan without Executing (Dry Run)
```bash
./target/release/nexus run "Analyze sales and write deployment script" --dry-run
```

#### 4. Cryptographically Verify an Execution Receipt
```bash
./target/release/nexus verify-receipt ./receipt.json
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
│       └── ci.yml               # GitHub Actions CI workflow (Check, Test, Build)
├── docs/
│   └── superpowers/
│       ├── specs/               # Architectural & Design specifications
│       └── plans/               # Detailed step-by-step implementation plans
├── src/
│   ├── main.rs                  # CLI entrypoint (clap subcommands)
│   ├── lib.rs                   # Library crate root
│   ├── error.rs                 # Centralized error definitions (thiserror)
│   ├── app_store/               # Worker registry & capability discovery
│   ├── blackboard/              # Thread-safe shared memory & pub/sub events
│   ├── router/                  # Task decomposition & failover supervisor
│   ├── agents/                  # Specialized worker agents (Coding, Research, Data, Ops)
│   ├── trust/                   # Bubblewrap sandbox, self-healing loop & Ed25519 receipts
│   └── llm/                     # Pluggable LLM interfaces & offline mock driver
├── tests/                       # Unit & End-to-end integration test suites
├── Cargo.toml                   # Cargo package configuration
└── README.md                    # Project documentation
```

---

## 🤝 Contributing & License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
Contributions, issues, and feature requests are welcome!
