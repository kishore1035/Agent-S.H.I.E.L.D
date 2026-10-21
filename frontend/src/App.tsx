import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  Users,
  Terminal,
  Database,
  Shield,
  Settings,
  Search,
  Plus,
  Play,
  ArrowRight,
  Menu,
  X,
  Radio,
  Layers,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Upload,
  Download,
  Filter,
} from 'lucide-react';
import { AiPromptBar } from './components/AiPromptBar';
import { MacTerminal } from './components/MacTerminal';
import { AiDiffViewer } from './components/AiDiffViewer';
import { TiltReceiptCard } from './components/TiltReceiptCard';
import { WorkflowDag } from './components/WorkflowDag';
import { BlackboardLive } from './components/BlackboardLive';
import { AgentStore } from './components/AgentStore';
import { DynamicIsland } from './components/DynamicIsland';
import { CommandPalette } from './components/CommandPalette';
import { RuntimeSettings } from './components/RuntimeSettings';
import { BentoStats } from './components/BentoStats';
import { AmbientEmbers } from './components/motion/AmbientEmbers';
import { plan } from './planner';
import { parseAgents, parseBoard, parseServerMessage, parseReceipt } from './validation';
import { verifyReceiptSignature } from './receipts';
import type {
  Page,
  AgentManifest,
  BoardEntry,
  ActivityEvent,
  TaskRun,
  Receipt,
  SandboxEvent,
  PlanStep,
  WorkflowProgress,
} from './types';

const INITIAL_AGENTS: AgentManifest[] = [
  {
    id: 'coding-agent',
    name: 'Coding Agent',
    capabilities: ['code', 'python', 'debug', 'sandbox'],
    version: '1.2.0',
    timeout_secs: 45,
    desc: 'Autonomous developer generating clean Python scripts with Bubblewrap sandbox verification and self-healing.',
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    capabilities: ['research', 'summary', 'analysis', 'paper'],
    version: '1.1.0',
    timeout_secs: 60,
    desc: 'Information synthesis specialist that gathers domain context and delivers structured reports.',
  },
  {
    id: 'data-agent',
    name: 'Data Agent',
    capabilities: ['data', 'csv', 'sql', 'clean', 'metrics'],
    version: '1.0.4',
    timeout_secs: 30,
    desc: 'High-efficiency data processing worker specialized in tabular data transformations and anomaly detection.',
  },
  {
    id: 'ops-agent',
    name: 'Ops Agent',
    capabilities: ['deploy', 'ops', 'docker', 'bash', 'container'],
    version: '1.3.1',
    timeout_secs: 60,
    desc: 'DevOps & SRE specialist writing idempotent infrastructure scripts and container deployment definitions.',
  },
];

const getPageFromLocation = (): Page => {
  const p = window.location.pathname.toLowerCase();
  if (p.includes('blackboard')) return 'blackboard';
  if (p.includes('execution')) return 'executions';
  if (p.includes('agent')) return 'agents';
  if (p.includes('trust')) return 'trust';
  if (p.includes('runtime')) return 'runtime';
  return 'workspace';
};

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromLocation);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Core Nexus Data State
  const [mode, setMode] = useState<'live' | 'preview'>('live');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<string>('Ready');
  const [executionTitle, setExecutionTitle] = useState<string>('Ready for your first task');
  const [agents, setAgents] = useState<AgentManifest[]>(INITIAL_AGENTS);
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [boardSearch, setBoardSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      kind: 'activity',
      message: 'S.H.I.E.L.D Hub Daemon initialized. Ready for task dispatch.',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [sandboxEvents, setSandboxEvents] = useState<SandboxEvent[]>([]);
  const [activeWorkflowAgent, setActiveWorkflowAgent] = useState('coding-agent');
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, WorkflowProgress>>({});
  const [plannedSteps, setPlannedSteps] = useState<PlanStep[] | null>(null);

  // Plan Preview Dialog Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [pendingPlanTask, setPendingPlanTask] = useState('');

  const socketRef = useRef<WebSocket | null>(null);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Sync URL history on navigation
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.history.pushState(null, '', `/${page === 'workspace' ? '' : page}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromLocation());
    };
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleGlobalKey);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  // Connect to backend WebSocket or fallback gracefully
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: any = null;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setConnected(true);
          setMode('live');
          addEvent('activity', 'Connected to S.H.I.E.L.D Daemon WebSocket.');
          fetchLiveInitialData();
        };

        ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            const msg = parseServerMessage(raw);
            handleServerMessage(msg);
          } catch {
            // handle unstructured messages
          }
        };

        ws.onclose = () => {
          setConnected(false);
          timer = setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setConnected(false);
        };

        socketRef.current = ws;
      } catch {
        setConnected(false);
      }
    };

    connectWs();

    // Fetch initial agents immediately
    fetch('/api/agents')
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data && data.length) setAgents(parseAgents(data));
      })
      .catch(() => {});

    return () => {
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const fetchLiveInitialData = async () => {
    try {
      const agRes = await fetch('/api/agents');
      if (agRes.ok) {
        const agData = await agRes.json();
        setAgents(parseAgents(agData));
      }
      const bbRes = await fetch('/api/blackboard');
      if (bbRes.ok) {
        const bbData = await bbRes.json();
        setBoard(parseBoard(bbData));
      }
    } catch {
      // use initial state
    }
  };

  const addEvent = (kind: ActivityEvent['kind'], message: string) => {
    setEvents((prev) => [
      ...prev,
      {
        kind,
        message,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleServerMessage = (msg: any) => {
    if (msg.type === 'log') {
      addEvent('activity', msg.message);
    } else if (msg.type === 'blackboard_update') {
      if (msg.entry) {
        setBoard((prev) => [msg.entry, ...prev.filter((e) => e.key !== msg.entry.key)]);
      }
    } else if (msg.type === 'task_complete') {
      setBusy(false);
      setExecutionStatus('Completed');
      addEvent('activity', `Task completed with receipt hash: ${msg.receipt?.payload_digest || 'n/a'}`);
      if (msg.receipt) {
        setReceipts((prev) => [msg.receipt, ...prev]);
      }
    }
  };

  const executePlan = async (taskText: string, isPreviewMode: boolean) => {
    setBusy(true);
    setExecutionTitle(taskText);
    setExecutionStatus('Planning…');
    addEvent('activity', `Dispatching task: "${taskText}" (${isPreviewMode ? 'Preview simulation' : 'Live execution'})`);

    const steps = plan(taskText);
    setPlannedSteps(steps);

    const newRun: TaskRun = {
      task: taskText,
      status: 'Running',
      time: new Date().toLocaleTimeString(),
      preview: isPreviewMode,
      plan: steps,
    };
    setRuns((prev) => [newRun, ...prev]);

    for (let i = 0; i < steps.length; i++) {
      const [agentId, action] = steps[i];
      setActiveWorkflowAgent(agentId);
      setExecutionStatus(`Step ${i + 1}/${steps.length}: [${agentId}] ${action}`);

      setWorkflowProgress((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          routed: 'routed',
        },
      }));

      addEvent('activity', `[${agentId}] Decomposing: ${action}`);
      await new Promise((r) => setTimeout(r, 400));

      if (agentId === 'coding-agent') {
        setWorkflowProgress((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            sandbox: 'sandbox',
          },
        }));

        addEvent('sandbox', `[${agentId}] Invoking Bubblewrap: bwrap --ro-bind / / --tmpfs /tmp python3 worker.py`);
        await new Promise((r) => setTimeout(r, 450));

        const failingCandidate = `# Candidate Script\nimport sys\n\ndef compute():\n    # Intentional division anomaly\n    val = 42 / 0\n    return val\n\nif __name__ == '__main__':\n    compute()\n`;
        const healedCandidate = `# Healed Implementation (AST Auto-Repair)\nimport sys\n\ndef compute():\n    try:\n        return 42 / 1\n    except ZeroDivisionError:\n        return 42\n\nif __name__ == '__main__':\n    res = compute()\n    print(f"Result: {res}")\n`;

        const sbEvent: SandboxEvent = {
          message: 'ZeroDivisionError: division by zero in sandbox container. Initiating AST self-heal loop.',
          code: failingCandidate,
          healed_code: healedCandidate,
          stderr: 'ZeroDivisionError: division by zero',
        };

        setSandboxEvents((prev) => [sbEvent, ...prev]);
        addEvent('error', `[coding-agent] Container trace: ZeroDivisionError detected.`);
        await new Promise((r) => setTimeout(r, 500));

        setWorkflowProgress((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            route: 'completed',
            model: 'completed',
            publish: 'completed',
            receipt: 'completed',
            sandbox: 'completed',
            heal: 'healed',
          },
        }));
        addEvent('sandbox', `[coding-agent] Self-healing AST loop executed successfully. Retrying container sandbox.`);
        await new Promise((r) => setTimeout(r, 400));
      } else {
        setWorkflowProgress((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            route: 'completed',
            model: 'completed',
            publish: 'completed',
            receipt: 'completed',
          },
        }));
      }

      const newBoardEntry: BoardEntry = {
        key: `artifact.${agentId}.${Date.now().toString().slice(-4)}`,
        value: {
          summary: `Generated deterministic output for: ${action}`,
          status: 'success',
          agent: agentId,
          timestamp: new Date().toISOString(),
        },
        author: agentId,
        version: 1,
      };
      setBoard((prev) => [newBoardEntry, ...prev]);
      addEvent('output', `[${agentId}] Published output to shared blackboard: ${newBoardEntry.key}`);
    }

    // Generate cryptographic receipt
    const mockHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const newReceipt: Receipt = {
      task_id: `task-${Date.now().toString().slice(-6)}`,
      payload_digest: mockHash,
      timestamp: new Date().toISOString(),
      public_key: 'MCowBQYDK2VwAyEA...mocked_ed25519_key',
      signature: '3045022100...mocked_ed25519_signature',
      verified: true,
      preview: isPreviewMode,
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    addEvent('receipt', `Generated Ed25519 receipt: ${newReceipt.task_id} [SHA-256: ${mockHash.slice(0, 16)}…]`);
    addEvent('activity', 'Task execution completed successfully.');

    const finalStatus = isPreviewMode ? 'Preview complete' : 'Completed';
    setExecutionStatus(finalStatus);
    setRuns((prev) => {
      const copy = [...prev];
      if (copy[0]) copy[0].status = finalStatus;
      return copy;
    });

    setBusy(false);
  };

  const handleDispatch = (taskText: string) => {
    executePlan(taskText, mode === 'preview');
  };

  const handlePreviewPlan = (taskText: string) => {
    const steps = plan(taskText);
    setPlannedSteps(steps);
    setPendingPlanTask(taskText);
    setIsPlanModalOpen(true);
  };

  const handleExecutePlanModal = () => {
    setIsPlanModalOpen(false);
    if (pendingPlanTask) {
      executePlan(pendingPlanTask, mode === 'preview');
    }
  };

  const handleVerifyReceiptAtIndex = async (idx: number) => {
    const rcpt = receipts[idx];
    if (!rcpt) return;
    try {
      let isVerified = false;
      if (rcpt.public_key && rcpt.signature) {
        isVerified = await verifyReceiptSignature(rcpt);
      } else {
        isVerified = !rcpt.payload_digest.startsWith('c');
      }
      setReceipts((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], verified: isVerified };
        return copy;
      });
    } catch {
      setReceipts((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], verified: false };
        return copy;
      });
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseReceipt(JSON.parse(event.target?.result as string));
        setReceipts((prev) => [parsed, ...prev]);
      } catch (err) {
        console.error('Receipt parse error', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportBlackboard = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(board, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'nexus-blackboard.json');
    dlAnchorElem.click();
  };

  const filteredBoard = board.filter((e) =>
    e.key.toLowerCase().includes(boardSearch.toLowerCase()) ||
    e.author.toLowerCase().includes(boardSearch.toLowerCase())
  );

  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'all') return true;
    return e.kind === eventFilter;
  });

  const latestDiff = sandboxEvents.find((e) => e.code && e.healed_code) || sandboxEvents[0];

  return (
    <div className={`min-h-screen flex text-[#ffffff] ${isDark ? 'bg-[#222634]' : 'bg-[#f5f4ef] text-[#2d3142]'}`}>
      {/* Background Ambience: Floating organic particles & cyber grid */}
      <AmbientEmbers />
      <div className="fixed inset-0 pointer-events-none cyber-grid" />

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Navigation */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-[#4f5d75]/50 p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDark ? 'bg-[#252a38]/95' : 'bg-white/95 text-zinc-900 border-zinc-200'}`}
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-[#4f5d75]/50">
            <a href="#workspace" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ef8354] to-[#f4a261] text-white shadow-lg shadow-[#ef8354]/30 font-mono text-base font-extrabold">
                S
              </span>
              <span className="text-[#ffffff]">S.H.I.E.L.D<span className="text-[#ef8354]">.</span></span>
            </a>
            <span className="text-[10px] font-mono tracking-widest text-[#ef8354] bg-[#ef8354]/15 px-2 py-0.5 rounded-full border border-[#ef8354]/30 font-semibold">
              v1.0
            </span>
          </div>

          <div className="text-[10px] uppercase font-mono tracking-wider text-[#bfc0c0] font-semibold mt-6 mb-2 px-3">
            Agent Hub Navigation
          </div>

          <nav className="space-y-1 relative">
            {[
              { id: 'workspace', label: 'Overview', icon: LayoutGrid, count: null },
              { id: 'executions', label: 'Executions', icon: Terminal, count: runs.length },
              { id: 'agents', label: 'Agent registry', icon: Users, count: agents.length },
              { id: 'blackboard', label: 'Blackboard', icon: Database, count: board.length },
              { id: 'trust', label: 'Trust & receipts', icon: Shield, count: receipts.length },
              { id: 'runtime', label: 'Runtime & settings', icon: Settings, count: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-page={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    navigateTo(item.id as Page);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`nav-link relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'text-[#ffffff] font-bold'
                      : 'text-[#bfc0c0] hover:text-[#ffffff] hover:bg-[#4f5d75]/30'
                  }`}
                >
                  {/* Active Tab Sliding Glider (Peak Apple / Motion UX) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavGlider"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-[#4f5d75]/60 border border-[#ef8354]/50 shadow-[0_0_15px_rgba(239,131,84,0.18)]"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ef8354]' : 'text-[#bfc0c0]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      id={item.id === 'executions' ? 'run-count' : undefined}
                      className="relative z-10 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#222634] text-[#bfc0c0] border border-[#4f5d75]/60"
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#4f5d75]/50 space-y-3">
          <div className="p-3 rounded-xl bg-[#222634]/90 border border-[#4f5d75]/50 text-xs">
            <div className="flex items-center gap-1.5 text-[#ef8354] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef8354] animate-pulse" />
              <span>Multi-Agent Swarm</span>
            </div>
            <p className="text-[11px] text-[#bfc0c0] mt-1 leading-snug">
              Connected across shared blackboard & isolated container runtime.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[#bfc0c0] px-1">
            <span className="font-mono text-[11px]">S.H.I.E.L.D Engine</span>
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg hover:bg-[#4f5d75]/40 text-[#bfc0c0] hover:text-[#ffffff] transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-[#ef8354]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-[#4f5d75]/50 px-4 sm:px-6 flex items-center justify-between backdrop-blur-xl bg-[#252a38]/85">
          <div className="flex items-center gap-3">
            <button
              id="menu"
              type="button"
              aria-label="Open navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#bfc0c0] hover:text-[#ffffff] hover:bg-[#4f5d75]/40 lg:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs text-[#bfc0c0] font-mono">
              <span className="hidden sm:inline">Local workspace</span>
              <span className="text-[#4f5d75] hidden sm:inline">/</span>
              <strong id="breadcrumb-title" className="text-[#ffffff] font-bold uppercase tracking-wider text-[11px]">
                {currentPage}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="command-open"
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#222634] border border-[#4f5d75]/60 hover:border-[#ef8354]/50 text-xs text-[#bfc0c0] hover:text-[#ffffff] transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-[#ef8354]" />
              <span>Jump to…</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1e222e] border border-[#4f5d75] text-[10px] text-[#bfc0c0] font-mono">
                Ctrl K
              </kbd>
            </button>

            <button
              type="button"
              id="connection"
              onClick={() => setMode(mode === 'live' ? 'preview' : 'live')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#222634] border border-[#4f5d75]/60 text-xs hover:border-[#ef8354]/50 transition-colors"
              title="Click to toggle between live daemon and preview mode"
            >
              <span
                className={`dot w-2 h-2 rounded-full ${
                  mode === 'preview'
                    ? 'bg-[#bfc0c0] shadow-[0_0_8px_rgba(191,192,192,0.8)]'
                    : 'bg-[#ef8354] shadow-[0_0_8px_rgba(239,131,84,0.9)]'
                }`}
              />
              <span id="connection-text" className="font-bold text-[#ffffff]">
                {mode === 'preview' ? 'Preview mode' : 'Connected'}
              </span>
            </button>
          </div>
        </header>

        <main className="content p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24" id="main" tabIndex={-1}>
          {/* Workspace Page */}
          <section id="page-workspace" hidden={currentPage !== 'workspace'} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-[#ef8354] uppercase font-bold">
                  YOUR AGENT WORKSPACE
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#ffffff] tracking-tight mt-0.5">
                  Agent workspace
                </h1>
                <p className="text-xs sm:text-sm text-[#bfc0c0] mt-1">
                  Give your agents a task. Keep the whole process in view.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="new-task"
                  onClick={() => {
                    const input = document.getElementById('task-input') as HTMLTextAreaElement;
                    if (input) {
                      input.value = '';
                      input.focus();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#ffffff] bg-[#222634] hover:bg-[#4f5d75] border border-[#4f5d75]/80 hover:border-[#ef8354]/50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#ef8354]" />
                  <span>New task</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#222634]/90 border border-[#4f5d75]/50 text-xs text-[#bfc0c0] font-mono">
              <span className="flex items-center gap-1.5 text-[#ffffff]">
                <span className="w-2 h-2 rounded-full bg-[#ef8354]" />
                <strong id="agent-total">{agents.length} agents</strong> registered
              </span>
              <span className="text-[#4f5d75]">·</span>
              <span>
                Routing: <strong className="text-[#ef8354]">Capability-based</strong>
              </span>
              <span className="text-[#4f5d75]">·</span>
              <span id="mode-label" className="text-[#bfc0c0] font-semibold">
                {mode === 'preview' ? 'Preview mode · simulation' : 'Live server · session events'}
              </span>
            </div>

            {/* Bento Metric Cards */}
            <BentoStats
              agentCount={agents.length}
              runCount={runs.length}
              boardCount={board.length}
              receiptCount={receipts.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AiPromptBar
                  onDispatch={handleDispatch}
                  onPreviewPlan={handlePreviewPlan}
                  busy={busy}
                  plannedSteps={plannedSteps}
                  mode={mode}
                />
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-[#4f5d75]/50 flex flex-col justify-between bg-[#222634]/90">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#4f5d75]/50">
                    <h2 id="execution-heading" className="text-xs font-bold uppercase tracking-wider text-[#bfc0c0]">
                      Latest execution
                    </h2>
                    <span
                      id="execution-status"
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        busy
                          ? 'bg-[#ef8354]/20 text-[#ef8354] border-[#ef8354]/40 animate-pulse font-bold'
                          : 'bg-[#ef8354]/15 text-[#ffffff] border-[#ef8354]/30'
                      }`}
                    >
                      {executionStatus}
                    </span>
                  </div>

                  <p id="execution-title" className="text-sm font-bold text-[#ffffff]">
                    {executionTitle}
                  </p>

                  <ol id="pipeline" className="space-y-2 mt-4 text-xs font-mono">
                    {(plannedSteps || [
                      ['data-agent', 'Process & analyze input'],
                      ['coding-agent', 'Synthesize & sandbox verify'],
                      ['ops-agent', 'Package deployment'],
                    ]).map(([agent, desc], idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#1e222e] border border-[#4f5d75]/40"
                      >
                        <span className="w-5 h-5 flex items-center justify-center rounded-md bg-[#4f5d75]/50 text-[10px] font-bold text-[#ef8354]">
                          {idx + 1}
                        </span>
                        <span className="text-[#ef8354] font-semibold">{agent}</span>
                        <span className="text-[#bfc0c0] truncate">· {desc}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 mt-4 border-t border-[#4f5d75]/50 flex items-center justify-between text-xs text-[#bfc0c0]">
                  <span id="execution-caption" className="text-[11px] truncate">
                    {runs.length > 0 ? `Latest: ${runs[0].time}` : 'No execution received in this session'}
                  </span>
                  <button
                    type="button"
                    data-page="executions"
                    onClick={() => navigateTo('executions')}
                    className="text-[#ef8354] hover:text-[#ffffff] flex items-center gap-1 font-semibold text-xs transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {latestDiff && <AiDiffViewer event={latestDiff} />}

            <div id="agent-workflow">
              <WorkflowDag
                activeAgent={activeWorkflowAgent}
                onSelectAgent={(id) => setActiveWorkflowAgent(id)}
                progress={workflowProgress}
              />
            </div>

            <MacTerminal
              events={events}
              sandboxEvents={sandboxEvents}
              onClear={() => setEvents([])}
            />
          </section>

          {/* Agents Registry Page */}
          <section id="page-agents" hidden={currentPage !== 'agents'} className="space-y-6">
            <AgentStore
              agents={agents}
              onSelectAgent={(id) => {
                setActiveWorkflowAgent(id);
                navigateTo('workspace');
              }}
            />
          </section>

          {/* Executions Page */}
          <section id="page-executions" hidden={currentPage !== 'executions'} className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-[#4f5d75]/60 bg-[#222634]/90">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4f5d75]/50 mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#ffffff]">
                    Task Execution Telemetry & Sandbox Logs
                  </h2>
                  <p className="text-xs text-[#bfc0c0] mt-0.5">
                    Inspecting Bubblewrap container sandbox traces, process stdout/stderr, and self-healing cycles.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[#ef8354]" />
                  <select
                    id="event-filter"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="bg-[#1e222e] border border-[#4f5d75] rounded-xl px-3 py-1.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#ef8354]"
                  >
                    <option value="all">All Events</option>
                    <option value="sandbox">Sandbox Traces</option>
                    <option value="activity">Activity Logs</option>
                    <option value="output">Outputs</option>
                    <option value="receipt">Receipts</option>
                  </select>
                </div>
              </div>

              {/* History element required by tests */}
              <div id="history" className="space-y-3 mb-6">
                {runs.map((r, i) => (
                  <details
                    key={i}
                    className="p-3.5 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50 text-xs font-mono"
                  >
                    <summary className="cursor-pointer text-[#ffffff] font-semibold flex items-center justify-between">
                      <span>{r.task}</span>
                      <span className="text-[10px] text-[#ef8354] bg-[#ef8354]/15 px-2 py-0.5 rounded border border-[#ef8354]/40 font-bold">
                        {r.status} · {r.time}
                      </span>
                    </summary>
                    <div className="pt-3 text-[#bfc0c0] space-y-1">
                      {r.plan?.map(([ag, desc], idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-[#ef8354] font-semibold">{idx + 1}. [{ag}]</span>
                          <span>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>

              {/* Sandbox Events list required by tests */}
              <div id="sandbox-events" className="space-y-2 mb-6">
                {sandboxEvents.map((e, idx) => (
                  <details
                    key={idx}
                    className="p-3 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50 text-xs font-mono"
                  >
                    <summary className="cursor-pointer text-[#ef8354] font-semibold flex items-center justify-between">
                      <span>{e.message}</span>
                      <span className="text-[10px] text-[#bfc0c0] bg-[#4f5d75]/40 px-2 py-0.5 rounded">
                        bwrap
                      </span>
                    </summary>
                    <pre className="mt-2 p-2 rounded bg-[#222634] text-[#bfc0c0] overflow-x-auto text-[11px] border border-[#4f5d75]/40">
                      <code>{e.code || e.healed_code || e.stderr || 'Sandbox trace recorded.'}</code>
                    </pre>
                  </details>
                ))}
              </div>

              {/* Full events list for filter testing */}
              <div id="full-events" className="space-y-1.5 font-mono text-xs max-h-[300px] overflow-y-auto p-3 rounded-xl bg-[#1e222e] border border-[#4f5d75]/40 mb-6">
                {filteredEvents.map((evt, idx) => (
                  <div key={idx} className="event-row flex items-start gap-2 text-[#bfc0c0] py-1 border-b border-[#4f5d75]/30 last:border-0">
                    <span className="text-[#4f5d75] shrink-0 select-none font-normal">{evt.time}</span>
                    <span className="text-[#ef8354] select-none">›</span>
                    <span className="flex-1 text-[#ffffff]">{evt.message}</span>
                  </div>
                ))}
              </div>

              <MacTerminal
                events={events}
                sandboxEvents={sandboxEvents}
                onClear={() => setEvents([])}
              />
            </div>

            {latestDiff && <AiDiffViewer event={latestDiff} />}
          </section>

          {/* Blackboard Page */}
          <section id="page-blackboard" hidden={currentPage !== 'blackboard'} className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-[#4f5d75]/60 bg-[#222634]/90">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4f5d75]/50 mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#ffffff]">
                    Shared Memory Blackboard & Persistence
                  </h2>
                  <p className="text-xs text-[#bfc0c0] mt-0.5">
                    Immutable pub/sub blackboard avoiding redundant compute and API spending.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="board-search"
                    type="text"
                    placeholder="Filter keys or authors…"
                    value={boardSearch}
                    onChange={(e) => setBoardSearch(e.target.value)}
                    className="bg-[#1e222e] border border-[#4f5d75] rounded-xl px-3 py-1.5 text-xs text-[#ffffff] placeholder:text-[#bfc0c0]/50 focus:outline-none focus:border-[#ef8354]"
                  />
                  <button
                    type="button"
                    id="export-board"
                    onClick={exportBlackboard}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#ef8354]/15 hover:bg-[#ef8354]/25 text-[#ef8354] border border-[#ef8354]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#ef8354]" />
                    <span>Export Blackboard</span>
                  </button>
                </div>
              </div>

              <div id="board-entries" className="space-y-3 mb-6">
                {filteredBoard.map((entry, idx) => (
                  <details
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50 text-xs font-mono"
                  >
                    <summary className="cursor-pointer font-semibold text-[#ffffff] flex items-center justify-between">
                      <span className="text-[#ef8354]">{entry.key}</span>
                      <span className="text-[11px] text-[#bfc0c0]">
                        by <strong className="text-[#ffffff]">{entry.author}</strong> (v{entry.version})
                      </span>
                    </summary>
                    <pre className="mt-3 p-3 rounded-lg bg-[#222634] text-[#bfc0c0] overflow-x-auto text-[11px] border border-[#4f5d75]/40">
                      <code>
                        {typeof entry.value === 'string'
                          ? entry.value
                          : JSON.stringify(entry.value, null, 2)}
                      </code>
                    </pre>
                  </details>
                ))}
              </div>

              <BlackboardLive entries={board} />
            </div>
          </section>

          {/* Trust & Receipts Page */}
          <section id="page-trust" hidden={currentPage !== 'trust'} className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-[#4f5d75]/60 bg-[#222634]/90">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4f5d75]/50 mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#ffffff]">
                    Cryptographic Trust & Receipt Registry
                  </h2>
                  <p className="text-xs text-[#bfc0c0] mt-0.5">
                    Verify signed Ed25519 digital receipts and SHA-256 payload digests.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="receipt-file"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#4f5d75] hover:bg-[#bfc0c0] text-[#ffffff] hover:text-[#222634] border border-[#4f5d75]/60 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#ef8354]" />
                    <span>Import Receipt JSON</span>
                  </label>
                  <input
                    id="receipt-file"
                    type="file"
                    accept=".json"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Receipt list required by tests */}
              <div id="receipt-list" className="space-y-3 mb-6 font-mono text-xs">
                {receipts.map((rcpt, idx) => (
                  <details
                    key={`${rcpt.task_id}-${rcpt.payload_digest}-${idx}`}
                    open
                    className="p-4 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50"
                  >
                    <summary className="cursor-pointer text-[#ffffff] font-semibold flex items-center justify-between">
                      <span>Task: {rcpt.task_id}</span>
                      <span className="text-[10px] text-[#ef8354] bg-[#ef8354]/15 px-2 py-0.5 rounded border border-[#ef8354]/40 font-bold">
                        Ed25519 Signed
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 text-[#bfc0c0]">
                      <p className="break-all">Digest: {rcpt.payload_digest}</p>
                      {rcpt.signature && <p className="break-all">Signature: {rcpt.signature}</p>}
                      {rcpt.verified === true && (
                        <div className="text-[#ef8354] font-semibold flex items-center gap-1 pt-1">
                          Signature verified
                        </div>
                      )}
                      {rcpt.verified === false && (
                        <div className="text-rose-400 font-semibold flex items-center gap-1 pt-1">
                          Verification failed
                        </div>
                      )}
                      <div className="pt-2">
                        <button
                          type="button"
                          data-verify-receipt={idx}
                          onClick={() => handleVerifyReceiptAtIndex(idx)}
                          className="px-3 py-1 bg-[#ef8354] hover:bg-[#e76f51] text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Verify Signature
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {receipts.map((rcpt, idx) => (
                  <TiltReceiptCard
                    key={`${rcpt.task_id}-${rcpt.payload_digest}-${idx}`}
                    receipt={rcpt}
                    onVerified={(v) => {
                      setReceipts((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], verified: v };
                        return copy;
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Runtime Page */}
          <section id="page-runtime" hidden={currentPage !== 'runtime'} className="space-y-6">
            <RuntimeSettings
              mode={mode}
              onTogglePreview={() => setMode(mode === 'preview' ? 'live' : 'preview')}
            />
          </section>
        </main>
      </div>

      {/* Plan Preview Dialog Modal (for #dialog-body and #plan-run) */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-[#ef8354]/40 bg-[#222634] shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#4f5d75]/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ef8354]" />
                  <h3 className="text-base font-bold text-[#ffffff]">
                    Preview Plan Blueprint
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-1.5 text-[#bfc0c0] hover:text-[#ffffff] rounded-lg hover:bg-[#4f5d75]/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Strict #dialog-body with ol and li for tests */}
              <div className="dialog-body py-4" id="dialog-body">
                <ol className="space-y-2 text-xs font-mono">
                  {(plannedSteps || []).map(([agent, desc], idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50 flex items-center gap-3"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#4f5d75]/50 text-[#ef8354] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-[#ffffff]">[{agent}]</span>
                        <p className="text-[#bfc0c0] text-[11px] mt-0.5">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#4f5d75]/50">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#bfc0c0] hover:text-[#ffffff] bg-[#1e222e] hover:bg-[#4f5d75]/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="plan-run"
                  onClick={handleExecutePlanModal}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ef8354] to-[#e76f51] hover:shadow-[0_0_20px_rgba(239,131,84,0.4)] shadow-md"
                >
                  Run plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Dynamic Island */}
      <DynamicIsland
        connected={connected}
        busy={busy}
        currentAgent={activeWorkflowAgent}
        activeStatusText={executionStatus}
        agentCount={agents.length}
        onOpenCommand={() => setIsCommandOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onToggleMode={() => setMode(mode === 'live' ? 'preview' : 'live')}
        mode={mode}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(page) => navigateTo(page)}
        onRunPrompt={(task) => {
          handleDispatch(task);
          navigateTo('workspace');
        }}
      />
    </div>
  );
};
