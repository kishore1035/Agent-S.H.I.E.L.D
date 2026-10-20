# Nexus Full Product Suite - Architecture & Design Specification

- **Date:** 2026-10-21
- **Status:** Approved
- **Target Implementation:** Python (FastAPI, WebSockets, Rich, SQLite WAL, Anthropic/Ollama/OpenAI)

---

## 1. Executive Summary

This specification expands Nexus into a full, production-ready product suite with:
1. **Interactive Realtime Web Dashboard (`nexus serve`)**: Built-in FastAPI + WebSocket server serving a dark-mode Tailwind UI displaying live DAG execution, blackboard updates, worker cards, and receipt verification.
2. **Multi-Provider LLM Auto-Discovery**: Automatic cascading detection between Anthropic Claude, OpenAI, local Ollama, and offline mock driver.
3. **Dynamic Plugin Architecture**: Drop-in external agent worker scripts loaded at runtime from `plugins/` or `~/.nexus/plugins/`.
4. **Persistent SQLite Blackboard**: Write-Ahead Logging (WAL) state backing that survives restarts.
5. **Rich Terminal Experience**: Formatted tables, live trees, and animated execution progress.
6. **Built-in Showcase Demos (`nexus demo`)**: Instant end-to-end demonstrations of task decomposition, self-healing code repair, and cryptographic receipts.

---

## 2. Component Layout & Architecture

```
nexus/
├── pyproject.toml
├── nexus/
│   ├── cli.py                     # Unified CLI entrypoint
│   ├── server/
│   │   ├── __init__.py
│   │   ├── app.py                 # FastAPI REST & WebSocket server
│   │   └── static/
│   │       └── index.html         # Realtime Tailwind Dashboard SPA
│   ├── plugins/
│   │   ├── __init__.py
│   │   └── loader.py              # Dynamic Python agent plugin discovery
│   ├── persistence/
│   │   ├── __init__.py
│   │   └── sqlite_store.py        # Asynchronous SQLite storage backend
│   ├── llm/
│   │   ├── factory.py             # Provider auto-discovery
│   │   ├── anthropic.py           # Anthropic Claude API client
│   │   └── ollama.py              # Local Ollama client
│   ├── ui/
│   │   ├── __init__.py
│   │   └── terminal.py            # Rich formatting for CLI output
│   └── demo/
│       ├── __init__.py
│       └── scenarios.py           # Pre-packaged demo flows
```

---

## 3. Detailed Specifications

### 3.1 Web Dashboard Server (`nexus/server/`)
- **Endpoints**:
  - `GET /`: Serves embedded single-page application.
  - `GET /api/agents`: Returns JSON list of all registered App Store workers.
  - `GET /api/blackboard`: Returns current blackboard snapshot.
  - `POST /api/run`: Launches background async task execution.
  - `WebSocket /ws`: Realtime bi-directional channel streaming execution events, blackboard updates, self-healing notifications, and signed receipts.

### 3.2 Persistent Blackboard (`nexus/persistence/sqlite_store.py`)
- Tables:
  - `blackboard_entries`: `key TEXT PRIMARY KEY, value TEXT, author TEXT, version INTEGER, timestamp TEXT`
- Async read/write methods integrated with `Blackboard` via listener callback.

### 3.3 Dynamic Plugin System (`nexus/plugins/loader.py`)
- Scans target directory for `.py` files.
- Inspects module classes inheriting from `nexus.agents.base.Agent`.
- Registers validated agent manifests into `AppStore`.

### 3.4 Multi-Provider LLM Engine (`nexus/llm/`)
- `create_llm_client()` checks:
  1. `ANTHROPIC_API_KEY` -> `AnthropicLlmClient`
  2. `OPENAI_API_KEY` -> `ApiLlmClient`
  3. Ollama healthcheck (`http://localhost:11434/api/tags`) -> `OllamaLlmClient`
  4. Fallback -> `MockLlmClient`

### 3.5 Terminal UI (`nexus/ui/terminal.py`)
- Uses `rich.table.Table`, `rich.panel.Panel`, `rich.console.Console`.
- Colored capability badges, status indicators, and formatted receipts.

---

## 4. Verification & Testing Strategy

1. **Server & WebSocket Tests**:
   - `test_dashboard_routes`: Verify static file delivery and REST endpoints.
   - `test_websocket_stream`: Verify connection and broadcast delivery.
2. **Persistence Tests**:
   - `test_sqlite_persistence`: Verify data survives blackboard reload.
3. **Plugin Loader Tests**:
   - `test_dynamic_plugin_loading`: Load temporary Python agent file dynamically.
4. **LLM Factory Tests**:
   - `test_llm_factory_selection`: Verify provider resolution precedence.
5. **CLI & Demo Tests**:
   - `test_demo_execution`: Run `nexus demo --scenario heal` with clean pass.
