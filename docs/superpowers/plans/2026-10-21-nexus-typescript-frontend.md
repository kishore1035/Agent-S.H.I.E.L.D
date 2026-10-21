# Nexus TypeScript Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade TypeScript + React 19 SPA frontend for Nexus styled with Yuva Garden's editorial typography and palette (`#f4f1ea`, serif headings, humanist sans, IBM Plex Mono) and high-density systems engineering observability (interactive DAG, live mission terminal, self-healing code inspector, and cryptographic receipts), served directly by FastAPI.

**Architecture:** Vite 6 + React 19 + TypeScript + Tailwind CSS bundle into `frontend/dist/`. FastAPI serves the compiled SPA at `/` while proxying `/ws` and `/api/*`. Type-safe WebSocket and REST hooks synchronize state reactively across the workspace, worker matrix, and shared blackboard.

**Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind CSS 4, Lucide React, FastAPI, Python 3.12, Pytest.

**Spec:** `docs/superpowers/specs/2026-10-21-nexus-typescript-frontend-design.md`

## Global Constraints
- Frontend lives in `/home/vinay/nexus/frontend/`
- Zero external co-author attribution lines in commits
- Must compile cleanly with `npm run build` (`tsc --noEmit && vite build`)
- All 24 backend Python pytest suites must remain 100% green

---

### Task 1: Scaffolding, Tooling & Package Configuration
**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`

- [x] **Step 1: Create package.json and configuration files**
- [x] **Step 2: Run npm install in frontend directory**
- [x] **Step 3: Run npm run build smoke test**
- [x] **Step 4: Commit**

---

### Task 2: Type System & Global Styles
**Files:**
- Create: `frontend/src/types/nexus.ts`
- Create: `frontend/src/index.css`

**Interfaces:**
- `AgentManifest`: `{ id, name, version, capabilities, timeout_secs }`
- `BlackboardEntry`: `{ key, value, author, version, timestamp }`
- `SignedReceipt`: `{ task_id, payload_digest, public_key, signature, timestamp }`
- `WsMessage`: `{ type: "log" | "blackboard_update" | "sandbox_event" | "receipt", ... }`

- [x] **Step 1: Define comprehensive TypeScript interfaces**
- [x] **Step 2: Create Tailwind CSS setup with Yuva Garden palette tokens**
- [x] **Step 3: Verify TypeScript compilation with tsc --noEmit**
- [x] **Step 4: Commit**

---

### Task 3: WebSocket & REST Reactive Hooks
**Files:**
- Create: `frontend/src/hooks/useNexusSocket.ts`
- Create: `frontend/src/hooks/useNexusApi.ts`

**Interfaces:**
- `useNexusSocket()`: `{ isConnected, events, sendTask, clearEvents, latestReceipt }`
- `useNexusApi()`: `{ fetchAgents(), fetchBlackboard(), runTaskRest() }`

- [x] **Step 1: Implement reconnecting WebSocket hook with event dispatching**
- [x] **Step 2: Implement REST API fetch client**
- [x] **Step 3: Verify TypeScript compilation**
- [x] **Step 4: Commit**

---

### Task 4: Layout & Observability Ribbon
**Files:**
- Create: `frontend/src/components/layout/Topbar.tsx`
- Create: `frontend/src/components/layout/MetricRibbon.tsx`

**Interfaces:**
- `Topbar`: Navigation tabs (`Workspace`, `Workers`, `Blackboard`), live WebSocket indicator, latency badge
- `MetricRibbon`: Realtime counters for active workers, blackboard revisions, sandboxes executed, and verified receipts

- [x] **Step 1: Build Topbar component**
- [x] **Step 2: Build MetricRibbon component**
- [x] **Step 3: Verify build**
- [x] **Step 4: Commit**

---

### Task 5: Workspace Subcomponents (Composer, DAG, Terminal, Healer)
**Files:**
- Create: `frontend/src/components/workspace/TaskComposer.tsx`
- Create: `frontend/src/components/workspace/ExecutionDag.tsx`
- Create: `frontend/src/components/workspace/MissionTerminal.tsx`
- Create: `frontend/src/components/workspace/HealingInspector.tsx`

**Interfaces:**
- `TaskComposer`: Textarea with `Ctrl+Enter` shortcut and benchmark preset chips
- `ExecutionDag`: Visual SVG DAG rendering subtask states (`PENDING`, `ROUTED`, `SANDBOXED`, `DONE`)
- `MissionTerminal`: Monospace streaming telemetry with log filters (`ALL`, `ROUTER`, `SANDBOX`, `CRYPTO`)
- `HealingInspector`: Visual breakdown of faulty code, container stderr, and healed output

- [ ] **Step 1: Implement TaskComposer with presets**
- [ ] **Step 2: Implement ExecutionDag with animated state transitions**
- [ ] **Step 3: Implement MissionTerminal with category filtering**
- [ ] **Step 4: Implement HealingInspector**
- [ ] **Step 5: Verify build**
- [ ] **Step 6: Commit**

---

### Task 6: Worker Matrix, Blackboard & Receipt Cards
**Files:**
- Create: `frontend/src/components/workers/WorkerMatrix.tsx`
- Create: `frontend/src/components/blackboard/BlackboardTable.tsx`
- Create: `frontend/src/components/crypto/ReceiptCard.tsx`

**Interfaces:**
- `WorkerMatrix`: Grid of App Store worker cards with capability tags and timeouts
- `BlackboardTable`: Key-value store with revision badges and formatted JSON viewer
- `ReceiptCard`: Ed25519 signature proof card with SHA-256 payload digest and verification badge

- [ ] **Step 1: Implement WorkerMatrix component**
- [ ] **Step 2: Implement BlackboardTable component**
- [ ] **Step 3: Implement ReceiptCard component**
- [ ] **Step 4: Verify build**
- [ ] **Step 5: Commit**

---

### Task 7: Root Application Assembly & FastAPI Serving
**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Modify: `nexus/server/app.py`
- Modify: `tests/test_server.py`

- [ ] **Step 1: Assemble full React App with tab routing and reactive state**
- [ ] **Step 2: Run npm run build to generate frontend/dist**
- [ ] **Step 3: Update nexus/server/app.py to mount frontend/dist if present**
- [ ] **Step 4: Run test_server.py to verify SPA serving**
- [ ] **Step 5: Commit**

---

### Task 8: End-to-End Verification & Remote Push
**Files:**
- Test: `npm run build`
- Test: `uv run pytest -v`

- [ ] **Step 1: Run complete frontend build**
- [ ] **Step 2: Run full backend test suite (24 tests)**
- [ ] **Step 3: Test live server boot and HTML response**
- [ ] **Step 4: Commit and push to origin main**
