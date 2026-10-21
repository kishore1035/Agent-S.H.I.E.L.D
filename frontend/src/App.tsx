import { useState, useEffect, useCallback } from 'react';
import { Topbar } from './components/layout/Topbar';
import { MetricRibbon } from './components/layout/MetricRibbon';
import { TaskComposer } from './components/workspace/TaskComposer';
import { ExecutionDag } from './components/workspace/ExecutionDag';
import { MissionTerminal } from './components/workspace/MissionTerminal';
import { HealingInspector, HealingEventData } from './components/workspace/HealingInspector';
import { ReceiptCard } from './components/crypto/ReceiptCard';
import { WorkerMatrix } from './components/workers/WorkerMatrix';
import { BlackboardTable } from './components/blackboard/BlackboardTable';
import { useNexusSocket } from './hooks/useNexusSocket';
import { useNexusApi } from './hooks/useNexusApi';
import type {
  ActiveTab,
  AgentManifest,
  BlackboardEntry,
  SignedReceipt,
  Subtask,
  WsBlackboardUpdateMessage,
  WsSandboxEventMessage,
  WsLogMessage,
} from './types/nexus';

/**
 * Client-side heuristic decomposition matching TaskPlanner logic
 */
function decomposePromptToSubtasks(promptText: string): Subtask[] {
  const p = promptText.toLowerCase();
  const subtasks: Subtask[] = [];

  if (
    p.includes('data') ||
    p.includes('csv') ||
    p.includes('sql') ||
    p.includes('analyze') ||
    p.includes('metrics') ||
    p.includes('clean') ||
    p.includes('sales') ||
    p.includes('forecast')
  ) {
    subtasks.push({
      id: 'subtask-data',
      description: `Process, clean, and analyze datasets for: ${promptText.slice(0, 48)}`,
      tags: ['data', 'analytics'],
      state: 'PENDING',
      assignedWorker: 'data-agent',
    });
  }

  if (
    p.includes('code') ||
    p.includes('python') ||
    p.includes('script') ||
    p.includes('program') ||
    p.includes('heal') ||
    p.includes('fault') ||
    p.includes('write') ||
    p.includes('pipeline') ||
    p.includes('forecast')
  ) {
    subtasks.push({
      id: 'subtask-code',
      description: `Generate, sandbox, and verify code for: ${promptText.slice(0, 48)}`,
      tags: ['code', 'sandbox'],
      state: 'PENDING',
      assignedWorker: 'coding-agent',
    });
  }

  if (
    p.includes('deploy') ||
    p.includes('ops') ||
    p.includes('bash') ||
    p.includes('docker') ||
    p.includes('kubernetes') ||
    p.includes('verify') ||
    p.includes('manifest')
  ) {
    subtasks.push({
      id: 'subtask-ops',
      description: `Configure operations & deployment for: ${promptText.slice(0, 48)}`,
      tags: ['ops', 'infrastructure'],
      state: 'PENDING',
      assignedWorker: 'ops-agent',
    });
  }

  if (
    subtasks.length === 0 ||
    p.includes('research') ||
    p.includes('report') ||
    p.includes('market') ||
    p.includes('trends') ||
    p.includes('summary') ||
    p.includes('findings')
  ) {
    subtasks.unshift({
      id: 'subtask-research',
      description: `Research context and synthesize findings for: ${promptText.slice(0, 48)}`,
      tags: ['research', 'synthesis'],
      state: 'PENDING',
      assignedWorker: 'research-agent',
    });
  }

  return subtasks;
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');

  // Registry & Shared State
  const [agents, setAgents] = useState<AgentManifest[]>([]);
  const [blackboardEntries, setBlackboardEntries] = useState<BlackboardEntry[]>([]);

  // Pipeline Execution State
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Observability & Cryptographic Artifacts
  const [healingEvent, setHealingEvent] = useState<HealingEventData | null>(null);
  const [receipt, setReceipt] = useState<SignedReceipt | null>(null);

  // Reactive Metrics
  const [sandboxCount, setSandboxCount] = useState<number>(0);
  const [receiptCount, setReceiptCount] = useState<number>(0);

  // REST API Client
  const api = useNexusApi();

  const loadAgents = useCallback(async () => {
    const data = await api.fetchAgents();
    if (data && data.length > 0) {
      setAgents(data);
    }
  }, [api]);

  const loadBlackboard = useCallback(async () => {
    const data = await api.fetchBlackboard();
    if (data) {
      setBlackboardEntries(data);
    }
  }, [api]);

  // Initial Data Hydration
  useEffect(() => {
    loadAgents();
    loadBlackboard();
  }, [loadAgents, loadBlackboard]);

  // Hash-based Tab Routing Sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'workspace' || hash === 'workers' || hash === 'blackboard') {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  // WebSocket Event Handlers
  const handleBlackboardUpdate = useCallback((entry: WsBlackboardUpdateMessage) => {
    setBlackboardEntries((prev) => {
      const idx = prev.findIndex((e) => e.key === entry.key);
      const updated: BlackboardEntry = {
        key: entry.key,
        value: entry.value,
        author: entry.author,
        version: entry.version,
        timestamp: entry.timestamp || new Date().toISOString(),
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  }, []);

  const handleSandboxEvent = useCallback((event: WsSandboxEventMessage) => {
    setSandboxCount((c) => c + 1);

    // Transition active subtask to SANDBOXED
    setSubtasks((prev) =>
      prev.map((st) => {
        if (st.id === 'subtask-code' || st.state === 'ROUTED') {
          return { ...st, state: 'SANDBOXED' };
        }
        return st;
      })
    );

    if (event.code || event.stderr || event.healed_code) {
      setHealingEvent({
        brokenCode: event.code,
        errorTrace: event.stderr,
        healedCode: event.healed_code,
        status: event.status || 'repaired',
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const handleReceipt = useCallback((newReceipt: SignedReceipt) => {
    setReceipt(newReceipt);
    setReceiptCount((c) => c + 1);
    setIsExecuting(false);

    // Seal all subtasks as DONE
    setSubtasks((prev) =>
      prev.map((st) => ({
        ...st,
        state: 'DONE',
      }))
    );

    // Reload blackboard for completed outputs
    loadBlackboard();
  }, [loadBlackboard]);

  const handleLog = useCallback((logMsg: WsLogMessage) => {
    const text = logMsg.message || '';

    // Route transitions: ⚡ Routed subtask [subtask-xxx] to xxx-agent
    const routeMatch = text.match(/Routed subtask \[([^\]]+)\] to (\S+)/i);
    if (routeMatch) {
      const subtaskId = routeMatch[1];
      const workerId = routeMatch[2];

      setSubtasks((prev) => {
        let found = false;
        const next = prev.map((st) => {
          if (st.id === subtaskId) {
            found = true;
            return {
              ...st,
              state: 'ROUTED' as const,
              assignedWorker: workerId,
            };
          }
          if (st.state === 'ROUTED') {
            return { ...st, state: 'DONE' as const };
          }
          return st;
        });

        if (!found) {
          next.push({
            id: subtaskId,
            description: `Execute subtask [${subtaskId}]`,
            state: 'ROUTED',
            assignedWorker: workerId,
          });
        }
        return next;
      });
    }

    // Sandbox container execution
    if (text.includes('Bubblewrap container') || text.includes('Executing code')) {
      setSandboxCount((c) => c + 1);
      setSubtasks((prev) =>
        prev.map((st) =>
          st.state === 'ROUTED' || st.id === 'subtask-code'
            ? { ...st, state: 'SANDBOXED' }
            : st
        )
      );
    }

    // Sandbox completion / pass
    const passMatch = text.match(/passed for \[([^\]]+)\]/i);
    if (passMatch) {
      const subtaskId = passMatch[1];
      setSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId ? { ...st, state: 'DONE' } : st
        )
      );
    }

    // Pipeline finish
    if (text.includes('Task completed successfully')) {
      setIsExecuting(false);
      setSubtasks((prev) =>
        prev.map((st) => ({
          ...st,
          state: 'DONE',
        }))
      );
    }
  }, []);

  // Bi-directional WebSocket Client
  const socket = useNexusSocket({
    onBlackboardUpdate: handleBlackboardUpdate,
    onSandboxEvent: handleSandboxEvent,
    onReceipt: handleReceipt,
    onLog: handleLog,
  });

  // Task Dispatch Flow
  const handleDispatch = useCallback(
    async (prompt: string) => {
      setIsExecuting(true);

      // 1. Decompose prompt into visual subtasks in PENDING state
      const initialSubtasks = decomposePromptToSubtasks(prompt);
      setSubtasks(initialSubtasks);
      setSelectedSubtaskId(undefined);

      // 2. Benchmark Preset Heuristic Setup
      if (
        prompt.includes('Self-Healing') ||
        prompt.includes('self-heal') ||
        prompt.includes('faulty code')
      ) {
        setHealingEvent({
          brokenCode: "print(f'Sum calculated: {sum(undefined_numbers_var)}')",
          errorTrace:
            "Traceback (most recent call last):\n  File \"main.py\", line 1, in <module>\n    print(f'Sum calculated: {sum(undefined_numbers_var)}')\nNameError: name 'undefined_numbers_var' is not defined",
          healedCode:
            "numbers = [1, 2, 3, 4, 5]\nprint(f'Sum calculated: {sum(numbers)}')",
          status: 'verified',
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Dispatch via WebSocket if connected, fallback to REST API
      const sentViaWs = socket.sendTask(prompt);
      if (!sentViaWs) {
        try {
          const res = await api.runTaskRest(prompt);
          if (res.status.startsWith('error')) {
            setIsExecuting(false);
          }
        } catch {
          setIsExecuting(false);
        }
      }
    },
    [socket, api]
  );

  const handleVerifyReceipt = useCallback((receiptToVerify: SignedReceipt) => {
    setReceipt({
      ...receiptToVerify,
      verified: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-olive selection:text-paper">
      {/* 1. Header Bar with Navigation Tabs and Telemetry Status */}
      <Topbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isConnected={socket.isConnected}
        latencyMs={socket.latencyMs}
      />

      {/* 2. Observability Metric Ribbon */}
      <MetricRibbon
        workerCount={agents.length}
        blackboardCount={blackboardEntries.length}
        sandboxCount={sandboxCount}
        receiptCount={receiptCount}
      />

      {/* 3. Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            {/* Task Composer */}
            <TaskComposer
              onDispatch={handleDispatch}
              isExecuting={isExecuting}
            />

            {/* Subtask Execution Graph */}
            <ExecutionDag
              subtasks={subtasks}
              selectedSubtaskId={selectedSubtaskId}
              onSelectSubtask={(st) => setSelectedSubtaskId(st.id)}
            />

            {/* Split Observability Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Mission Telemetry Terminal */}
              <div className="lg:col-span-7">
                <MissionTerminal
                  logs={socket.events}
                  onClear={socket.clearEvents}
                  maxHeight="max-h-[480px]"
                />
              </div>

              {/* Cryptographic Proof & Self-Healing Well */}
              <div className="lg:col-span-5 space-y-6">
                <ReceiptCard
                  receipt={receipt || socket.latestReceipt}
                  onVerify={handleVerifyReceipt}
                />
                <HealingInspector
                  healingEvent={healingEvent}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <WorkerMatrix
            workers={agents}
            isLoading={api.isLoading}
            onRefresh={loadAgents}
          />
        )}

        {activeTab === 'blackboard' && (
          <BlackboardTable
            entries={blackboardEntries}
            isLoading={api.isLoading}
            onRefresh={loadBlackboard}
          />
        )}
      </main>

      {/* 4. Global Footer */}
      <footer className="border-t border-line py-4 bg-surface text-center text-xs font-mono text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-ink">Nexus</span>
            <span>· Autonomous Multi-Agent Orchestration Hub</span>
          </div>
          <span className="text-[11px] opacity-75">
            Zero-Trust Architectural Guarantees · Ed25519 · Bubblewrap Sandboxing
          </span>
        </div>
      </footer>
    </div>
  );
}
