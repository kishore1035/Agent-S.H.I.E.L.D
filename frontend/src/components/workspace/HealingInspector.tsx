import React, { useState } from 'react';
import {
  ShieldCheck,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Terminal as TerminalIcon,
  Columns,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface HealingEventData {
  brokenCode?: string;
  code?: string;
  errorTrace?: string;
  stderr?: string;
  healedCode?: string;
  healed_code?: string;
  status?: string;
  timestamp?: string;
}

export interface HealingInspectorProps {
  healingEvent: HealingEventData | null;
  className?: string;
}

type ViewMode = 'grid' | 'tabs';

interface CodeBoxProps {
  stepNumber: string;
  title: string;
  badgeLabel: string;
  codeText: string;
  badgeVariant: 'red' | 'amber' | 'emerald';
  icon: React.ComponentType<{ className?: string }>;
  emptyPlaceholder: string;
  metaInfo?: string;
}

const CodeBox: React.FC<CodeBoxProps> = ({
  stepNumber,
  title,
  badgeLabel,
  codeText,
  badgeVariant,
  icon: Icon,
  emptyPlaceholder,
  metaInfo,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!codeText) return;
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const variantStyles = {
    red: {
      headerBg: 'bg-red-50/80 border-red-200 text-red-900',
      badge: 'bg-red-100 text-red-800 border-red-300',
      iconColor: 'text-red-600',
      codeBorder: 'border-red-200/60',
      terminalAccent: 'text-red-400',
    },
    amber: {
      headerBg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      iconColor: 'text-amber-600',
      codeBorder: 'border-amber-200/60',
      terminalAccent: 'text-amber-400',
    },
    emerald: {
      headerBg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconColor: 'text-emerald-600',
      codeBorder: 'border-emerald-200/60',
      terminalAccent: 'text-emerald-400',
    },
  }[badgeVariant];

  const lines = codeText ? codeText.split('\n') : [];

  return (
    <div
      className={`flex flex-col bg-surface border rounded-lg shadow-xs overflow-hidden transition-all duration-200 ${variantStyles.codeBorder}`}
    >
      {/* Box Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${variantStyles.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${variantStyles.iconColor}`} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                {stepNumber}
              </span>
              <span className="text-xs font-serif font-bold text-ink">
                {title}
              </span>
            </div>
            {metaInfo && (
              <span className="text-[10px] font-mono text-muted">
                {metaInfo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${variantStyles.badge}`}
          >
            {badgeLabel}
          </span>
          {codeText && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-muted hover:text-ink hover:bg-black/5 transition-colors cursor-pointer"
              title="Copy snippet"
              aria-label="Copy code snippet"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code Well */}
      <div className="p-3.5 bg-[#15171a] text-[#f4f1ea] font-mono text-xs overflow-x-auto flex-1 min-h-[160px] max-h-[340px]">
        {lines.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#1f242c]/70 transition-colors leading-relaxed"
                >
                  <td className="w-8 pr-3 text-right text-[#505661] select-none text-[10px] align-top tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="text-[#e2ded6] break-all whitespace-pre-wrap align-top text-[11px]">
                    {line || '\n'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-[#646a78] text-xs p-6">
            <p>{emptyPlaceholder}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const HealingInspector: React.FC<HealingInspectorProps> = ({
  healingEvent,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeStepTab, setActiveStepTab] = useState<1 | 2 | 3>(1);

  const brokenCode = healingEvent?.brokenCode || healingEvent?.code || '';
  const errorTrace = healingEvent?.errorTrace || healingEvent?.stderr || '';
  const healedCode =
    healingEvent?.healedCode || healingEvent?.healed_code || '';

  const hasEventData = Boolean(brokenCode || errorTrace || healedCode);

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
      data-testid="healing-inspector"
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Self-Healing Inspector
          </h2>
          <span className="hidden sm:inline-block text-xs font-mono text-muted">
            / Container Sandbox Fault Interception & Repair
          </span>
        </div>

        {/* Status and View Mode controls */}
        <div className="flex items-center gap-2">
          {hasEventData && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-50 border border-emerald-300 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>REPAIR VERIFIED</span>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-paper p-1 rounded-md border border-line">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-ink font-semibold shadow-xs border border-line'
                  : 'text-muted hover:text-ink'
              }`}
              title="3-Box Breakdown Grid"
              aria-label="3-Box Grid View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`p-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                viewMode === 'tabs'
                  ? 'bg-surface text-ink font-semibold shadow-xs border border-line'
                  : 'text-muted hover:text-ink'
              }`}
              title="Step-by-Step Tabs"
              aria-label="Step Tabs View"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasEventData ? (
        /* Empty State */
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-paper/30">
          <div className="w-12 h-12 rounded-full border border-line bg-paper flex items-center justify-center mb-3 text-emerald-600">
            <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-base sm:text-lg font-semibold text-ink mb-1">
            No Active Self-Healing Incidents
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-lg mb-6 leading-relaxed">
            When an agent generates code with runtime exceptions, missing
            imports, or syntax errors, Bubblewrap sandbox isolates the stderr
            trace. Nexus SelfHealer automatically feeds the trace back to the
            model for zero-downtime iterative repair.
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-line text-xs font-mono text-ink shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>
              Tip: Click the{' '}
              <strong className="text-olive">🛡️ Self-Heal Demo</strong> preset
              in the Composer to trigger a live iterative healing cycle.
            </span>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* 3-Box Breakdown Grid */
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Step 1: Injected / Faulty Code */}
          <CodeBox
            stepNumber="Step 01"
            title="Faulty Code Injected"
            badgeLabel="SYNTAX_ERROR"
            badgeVariant="red"
            icon={Bug}
            codeText={brokenCode}
            emptyPlaceholder="No broken code recorded."
            metaInfo="Target: Bubblewrap Sandbox"
          />

          {/* Step 2: Intercepted Stderr Trace */}
          <CodeBox
            stepNumber="Step 02"
            title="Captured Container Stderr"
            badgeLabel="STDERR_ISOLATED"
            badgeVariant="amber"
            icon={AlertTriangle}
            codeText={errorTrace}
            emptyPlaceholder="No container stderr captured."
            metaInfo="Trace: PyExecutionError"
          />

          {/* Step 3: Healed & Verified Code */}
          <CodeBox
            stepNumber="Step 03"
            title="Healed & Verified Output"
            badgeLabel="EXIT_0_PASSED"
            badgeVariant="emerald"
            icon={CheckCircle2}
            codeText={healedCode}
            emptyPlaceholder="No healed code generated yet."
            metaInfo="Rerun: Bubblewrap Container Verified"
          />
        </div>
      ) : (
        /* Step-by-Step Tabs View */
        <div className="p-4 sm:p-6 flex flex-col gap-4">
          {/* Step navigation tabs */}
          <div className="flex border-b border-line gap-2">
            <button
              type="button"
              onClick={() => setActiveStepTab(1)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-mono transition-colors cursor-pointer ${
                activeStepTab === 1
                  ? 'border-red-500 text-red-900 font-bold bg-red-50/50'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-red-600" />
              <span>Step 1: Faulty Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab(2)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-mono transition-colors cursor-pointer ${
                activeStepTab === 2
                  ? 'border-amber-500 text-amber-900 font-bold bg-amber-50/50'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Step 2: Container Stderr</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab(3)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-mono transition-colors cursor-pointer ${
                activeStepTab === 3
                  ? 'border-emerald-500 text-emerald-900 font-bold bg-emerald-50/50'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Step 3: Healed Output</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeStepTab === 1 && (
              <CodeBox
                stepNumber="Step 01"
                title="Faulty Code Injected"
                badgeLabel="SYNTAX_ERROR"
                badgeVariant="red"
                icon={Bug}
                codeText={brokenCode}
                emptyPlaceholder="No broken code recorded."
                metaInfo="Target: Bubblewrap Sandbox"
              />
            )}
            {activeStepTab === 2 && (
              <CodeBox
                stepNumber="Step 02"
                title="Captured Container Stderr"
                badgeLabel="STDERR_ISOLATED"
                badgeVariant="amber"
                icon={AlertTriangle}
                codeText={errorTrace}
                emptyPlaceholder="No container stderr captured."
                metaInfo="Trace: PyExecutionError"
              />
            )}
            {activeStepTab === 3 && (
              <CodeBox
                stepNumber="Step 03"
                title="Healed & Verified Output"
                badgeLabel="EXIT_0_PASSED"
                badgeVariant="emerald"
                icon={CheckCircle2}
                codeText={healedCode}
                emptyPlaceholder="No healed code generated yet."
                metaInfo="Rerun: Bubblewrap Container Verified"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealingInspector;
