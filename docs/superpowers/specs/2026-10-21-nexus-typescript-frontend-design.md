# Nexus TypeScript Frontend Design Specification

**Date:** 2026-10-21  
**Project:** Nexus Autonomous Multi-Agent Orchestration Hub  
**Deliverable:** Modern TypeScript + React 19 SPA Frontend (`frontend/`)

---

## 1. Executive Summary

Nexus currently serves a single-file static HTML dashboard from `nexus/server/static/index.html`. This specification defines the architecture, design system, component hierarchy, and integration patterns for a production-grade TypeScript SPA built with React 19, Vite, Tailwind CSS, Lucide icons, and bidirectional WebSocket streaming.

The design takes direct inspiration from `yuva-garden-next`'s editorial, warm-paper typography and tactile materiality (`#f4f1ea`, Bodoni/Newsreader serifs, Hanken Grotesk sans, IBM Plex Mono) paired with high-density systems engineering observability (interactive execution DAGs, realtime mission telemetry, self-healing diff inspection, and Ed25519 cryptographic receipt auditing).

---

## 2. Technical Stack & Tooling

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime & Bundler** | Vite | 6.x | Instant HMR development server & production builds |
| **Framework** | React + ReactDOM | 19.x | Declarative UI components & Concurrent React primitives |
| **Language** | TypeScript | 5.x | Strict type safety across manifests, receipts, and WebSocket messages |
| **Styling** | Tailwind CSS | 4.x / PostCSS | Utility-first CSS with custom CSS variable design tokens |
| **Icons** | `lucide-react` | 1.x | Sharp, geometric system iconography |
| **Backend Integration** | FastAPI StaticFiles | - | Production serving from `frontend/dist/` at `http://localhost:8000/` |

---

## 3. Design System & Visual Hierarchy

### 3.1 Color Palette
- **Canvas / Surface:**
  - Background Paper: `#f4f1ea`
  - Elevated Card Surface: `#faf9f6`
  - Inset Well / Code Canvas: `#1b2a1f` (Deep forest ink)
- **Typography & Ink:**
  - Primary Text: `#1b2a1f`
  - Muted Text: `#646a78`
  - Hairline Borders: `#d8d4cb` and `rgba(27, 42, 31, 0.12)`
- **Functional Accents:**
  - Heritage Accent Gold: `#6b5a2e`
  - Botanical Olive: `#64864d`
  - Verification & Success Green: `#168343`
  - Container / Warning Amber: `#b67922`
  - Error Red: `#aa342b`

### 3.2 Typography Tokens
- **Serif Display:** `Newsreader`, `Bodoni Moda`, Georgia, serif (Headings, hero titles, statement metrics)
- **Humanist Sans:** `Hanken Grotesk`, `IBM Plex Sans`, system-ui, sans-serif (Body copy, buttons, labels)
- **Monospace Telemetry:** `IBM Plex Mono`, `JetBrains Mono`, monospace (Hashes, signatures, code blocks, DAG nodes)

---

## 4. Architecture & Component Hierarchy

```
frontend/
├── index.html                  # HTML entrypoint with Google Fonts link
├── package.json                # Dependencies: react, react-dom, lucide-react, vite, tailwindcss
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Proxy /api and /ws to http://127.0.0.1:8000
└── src/
    ├── main.tsx                # Mounts React DOM
    ├── App.tsx                 # Navigation, active tab state, global telemetry
    ├── types/
    │   └── nexus.ts            # Type definitions: Agent, Subtask, BlackboardEntry, SignedReceipt, WsMessage
    ├── hooks/
    │   ├── useNexusSocket.ts   # Reconnecting WebSocket with event routing
    │   └── useNexusApi.ts      # Fetch helpers for /api/agents, /api/blackboard, /api/run
    ├── components/
    │   ├── layout/
    │   │   ├── Topbar.tsx      # Brand mark, tab links (Workspace, Agents, Blackboard), live WS status
    │   │   └── MetricBar.tsx   # Stat tiles: Workers, Blackboard Keys, Sandboxes, Receipts
    │   ├── workspace/
    │   │   ├── TaskComposer.tsx     # Monospace prompt textarea, presets chips, run button
    │   │   ├── ExecutionDag.tsx     # Visual DAG of subtasks (Pending → Routed → Sandboxed → Done)
    │   │   ├── MissionTerminal.tsx  # Timestamped log stream with level filters and autoscroll
    │   │   └── HealingInspector.tsx # Container error interception and self-healed code output
    │   ├── workers/
    │   │   └── WorkerMatrix.tsx     # App store worker cards with capability tags
    │   ├── blackboard/
    │   │   └── BlackboardTable.tsx  # Live key-value store with revision badges & JSON viewer
    │   └── crypto/
    │       └── ReceiptCard.tsx      # Ed25519 signature proof card with SHA-256 digest
```

---

## 5. Data Flow & WebSocket Event Lifecycle

```
[User Input] ────────> TaskComposer (Ctrl+Enter)
                             │
                             ▼
                   WebSocket /ws ("run_task")
                             │
                             ▼
                    Nexus Server Daemon
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[type: "log"]     [type: "sandbox_event"]  [type: "receipt"]
       │                     │                     │
       ▼                     ▼                     ▼
MissionTerminal      HealingInspector         ReceiptCard
(Live stream)        (Self-healing diff)      (Ed25519 verify)
```

1. **Hydration:** On mount, `App.tsx` calls `GET /api/agents` and `GET /api/blackboard`.
2. **Duplex Streaming:** `useNexusSocket` connects to `ws://${window.location.host}/ws`.
3. **Reactive Blackboard:** Server broadcasts `blackboard_update` on write; `BlackboardTable` updates immediately without full page reloads.
4. **FastAPI Serving:** `nexus/server/app.py` checks if `frontend/dist` exists; if so, mounts `StaticFiles(directory="frontend/dist", html=True)`. If not, falls back to `nexus/server/static/index.html`.

---

## 6. Verification & Testing Strategy

1. **TypeScript Build Verification:** `npm run build` must compile cleanly with `tsc --noEmit` and Vite bundle to `frontend/dist/`.
2. **FastAPI E2E Route Verification:**
   - `GET /` serves the compiled React application.
   - `GET /api/agents` returns JSON array of registered workers.
   - `POST /api/run` dispatches tasks cleanly.
   - `WS /ws` streams live log events to the frontend.
3. **Backend Test Suite:** `uv run pytest -v` must maintain 100% pass rate across all 24 existing tests.
