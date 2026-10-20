# Nexus Full Product Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Nexus into a complete, full-featured enterprise product with a realtime web dashboard, WebSocket streaming, Rich terminal UI, multi-provider LLM engine (Anthropic, Ollama, OpenAI), SQLite persistent blackboard, dynamic agent plugin loader, and interactive demo scenarios.

**Architecture:** The core engine is extended with an asynchronous FastAPI daemon supporting WebSocket broadcasts for all blackboard mutations and agent lifecycle transitions. Storage is supplemented with an async SQLite WAL backend. External agents can be loaded dynamically from filesystem directories. Rich terminal formatters elevate the CLI output.

**Tech Stack:** Python 3.11+, FastAPI, Uvicorn, WebSockets, Rich, Aiosqlite, Click, Pydantic v2, Cryptography, Httpx, Pytest.

**Spec:** `docs/superpowers/specs/2026-10-21-nexus-full-product-suite-design.md`

## Global Constraints
- Target package directory: `nexus/`
- All errors inherit from `NexusError`
- Single unified CLI `nexus` handles `run`, `serve`, `list-agents`, `verify-receipt`, and `demo`
- Zero external co-author attribution lines in commits

---

### Task 1: Add Product Dependencies
**Files:**
- Modify: `pyproject.toml`
- Test: verify `uv sync` resolves new packages

- [x] **Step 1: Update pyproject.toml dependencies**
- [x] **Step 2: Run uv sync**
- [x] **Step 3: Commit**

---

### Task 2: Persistent SQLite Blackboard Engine
**Files:**
- Create: `nexus/persistence/__init__.py`
- Create: `nexus/persistence/sqlite_store.py`
- Modify: `nexus/blackboard/memory.py`
- Test: `tests/test_persistence.py`

**Interfaces:**
- `SqliteBlackboardStore`:
  - `async initialize()`
  - `async save_entry(entry: BlackboardEntry)`
  - `async load_all() -> list[BlackboardEntry]`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 3: Multi-Provider LLM Engine
**Files:**
- Create: `nexus/llm/anthropic.py`
- Create: `nexus/llm/ollama.py`
- Create: `nexus/llm/factory.py`
- Test: `tests/test_llm_factory.py`

**Interfaces:**
- `AnthropicLlmClient(LlmClient)`
- `OllamaLlmClient(LlmClient)`
- `create_llm_client(preferred: str | None = None) -> LlmClient`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 4: Dynamic Agent Plugin Loader
**Files:**
- Create: `nexus/plugins/__init__.py`
- Create: `nexus/plugins/loader.py`
- Test: `tests/test_plugins.py`

**Interfaces:**
- `PluginLoader`:
  - `load_from_directory(dir_path: str) -> list[Agent]`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 5: Rich Terminal UI Engine
**Files:**
- Create: `nexus/ui/__init__.py`
- Create: `nexus/ui/terminal.py`
- Test: `tests/test_ui.py`

**Interfaces:**
- `render_agent_table(agents: list[AgentManifest])`
- `render_plan_tree(subtasks: list[Subtask])`
- `render_receipt_panel(receipt: SignedReceipt)`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 6: Web Dashboard Server & Realtime WebSocket
**Files:**
- Create: `nexus/server/__init__.py`
- Create: `nexus/server/app.py`
- Create: `nexus/server/static/index.html`
- Test: `tests/test_server.py`

**Interfaces:**
- `create_app(...) -> FastAPI`
- WebSocket `/ws` broadcast loop

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 7: Interactive Demo Engine
**Files:**
- Create: `nexus/demo/__init__.py`
- Create: `nexus/demo/scenarios.py`
- Test: `tests/test_demo.py`

**Interfaces:**
- `run_demo_scenario(name: str) -> None`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 8: CLI Commands & Unified Integration
**Files:**
- Modify: `nexus/cli.py`
- Test: `tests/test_e2e_product.py`

- [x] **Step 1: Write failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement minimal code**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**
