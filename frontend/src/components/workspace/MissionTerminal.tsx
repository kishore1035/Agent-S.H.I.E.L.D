import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Search,
  ArrowDown,
} from 'lucide-react';
import type { TelemetryLog, LogCategory } from '../../types/nexus';

export interface MissionTerminalProps {
  logs: TelemetryLog[];
  onClear: () => void;
  className?: string;
  maxHeight?: string;
}

type StepTag =
  | '[ROUTER]'
  | '[SANDBOX]'
  | '[CRYPTO]'
  | '[RECEIPT]'
  | '[WARN]'
  | '[SUCCESS]'
  | '[ERROR]';

interface TagStyle {
  label: StepTag;
  className: string;
}

function resolveTag(log: TelemetryLog): TagStyle {
  const msg = log.message;
  const lower = msg.toLowerCase();
  const lvl = log.level;

  if (
    lower.includes('[receipt]') ||
    (log.category === 'CRYPTO' && lower.includes('receipt'))
  ) {
    return {
      label: '[RECEIPT]',
      className:
        'text-emerald-400 bg-emerald-950/60 border-emerald-800/80 ring-1 ring-emerald-500/20',
    };
  }

  if (
    lvl === 'error' ||
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('❌') ||
    lower.includes('fatal')
  ) {
    return {
      label: '[WARN]',
      className:
        'text-red-400 bg-red-950/60 border-red-800/80 ring-1 ring-red-500/20',
    };
  }

  if (lvl === 'warn' || lower.includes('warn') || lower.includes('⚠️')) {
    return {
      label: '[WARN]',
      className:
        'text-amber-400 bg-amber-950/60 border-amber-800/80 ring-1 ring-amber-500/20',
    };
  }

  if (
    lvl === 'success' ||
    lower.includes('success') ||
    lower.includes('passed') ||
    lower.includes('healed') ||
    lower.includes('verified') ||
    lower.includes('✅') ||
    lower.includes('✨')
  ) {
    return {
      label: '[SUCCESS]',
      className:
        'text-green-400 bg-green-950/60 border-green-800/80 ring-1 ring-green-500/20',
    };
  }

  if (
    log.category === 'SANDBOX' ||
    lower.includes('sandbox') ||
    lower.includes('bubblewrap') ||
    lower.includes('container')
  ) {
    return {
      label: '[SANDBOX]',
      className:
        'text-amber-300 bg-amber-950/50 border-amber-800/60 ring-1 ring-amber-500/20',
    };
  }

  if (
    log.category === 'CRYPTO' ||
    lower.includes('crypto') ||
    lower.includes('signature') ||
    lower.includes('ed25519') ||
    lower.includes('digest')
  ) {
    return {
      label: '[CRYPTO]',
      className:
        'text-purple-300 bg-purple-950/60 border-purple-800/70 ring-1 ring-purple-500/20',
    };
  }

  // Default to Router
  return {
    label: '[ROUTER]',
    className:
      'text-cyan-300 bg-cyan-950/60 border-cyan-800/70 ring-1 ring-cyan-500/20',
  };
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '--:--:--';
  // If it's already HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 8);
  }
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour12: false });
    }
  } catch {
    // Fall through
  }
  return timestamp.slice(0, 8);
}

const CATEGORIES: LogCategory[] = ['ALL', 'ROUTER', 'SANDBOX', 'CRYPTO'];

export const MissionTerminal: React.FC<MissionTerminalProps> = ({
  logs,
  onClear,
  className = '',
  maxHeight = 'max-h-[380px]',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<LogCategory, number> = {
      ALL: logs.length,
      ROUTER: 0,
      SANDBOX: 0,
      CRYPTO: 0,
    };
    for (const log of logs) {
      if (log.category && log.category in counts) {
        counts[log.category] += 1;
      }
    }
    return counts;
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(query);
        const matchesCat = log.category.toLowerCase().includes(query);
        if (!matchesMsg && !matchesCat) return false;
      }
      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopy = async () => {
    if (logs.length === 0) return;
    const text = filteredLogs
      .map((l) => `[${formatTimestamp(l.timestamp)}] [${l.category}] ${l.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleScrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  return (
    <div
      className={`rounded-lg border border-line bg-[#15171a] text-[#f4f1ea] shadow-md overflow-hidden flex flex-col font-mono ${className}`}
      data-testid="mission-terminal"
    >
      {/* Top Console Bar */}
      <div className="px-4 py-3 bg-[#101214] border-b border-[#2a2f35] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Terminal Brand & Active Dot */}
        <div className="flex items-center gap-2.5">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-serif text-sm font-semibold text-[#f4f1ea] tracking-wide">
            Mission Telemetry
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="uppercase tracking-wider font-semibold">Live</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-[#1a1e23] p-1 rounded-md border border-[#2a2f35]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wider transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2a3038] text-white font-semibold shadow-xs'
                    : 'text-[#8c94a0] hover:text-[#d0d7de] hover:bg-[#20252b]'
                }`}
                aria-pressed={isSelected}
              >
                <span>{cat}</span>
                <span className="ml-1 text-[10px] opacity-70 tabular-nums">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-1.5 text-xs text-[#8c94a0] hover:text-[#d0d7de] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-[11px]">Auto-scroll</span>
          </label>

          <div className="h-3.5 w-px bg-[#2a2f35] mx-1" />

          {/* Copy logs */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="p-1.5 text-[#8c94a0] hover:text-[#f4f1ea] hover:bg-[#20252b] rounded transition-colors disabled:opacity-40 cursor-pointer"
            title="Copy logs to clipboard"
            aria-label="Copy logs"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Clear logs */}
          <button
            type="button"
            onClick={onClear}
            disabled={logs.length === 0}
            className="p-1.5 text-[#8c94a0] hover:text-red-400 hover:bg-[#20252b] rounded transition-colors disabled:opacity-40 cursor-pointer"
            title="Clear telemetry logs"
            aria-label="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-bar: Search and Line Counter */}
      <div className="px-4 py-2 bg-[#14171a] border-b border-[#22272e] flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#646a78]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter messages..."
            className="w-full bg-[#1b2026] text-[#e6ede7] placeholder:text-[#5a626d] text-[11px] pl-7 pr-2.5 py-1 rounded border border-[#2a2f35] focus:outline-none focus:border-emerald-600/60"
          />
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#8c94a0] tabular-nums">
          <span>
            Showing {filteredLogs.length} / {logs.length} events
          </span>
          {!autoScroll && (
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="inline-flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Bottom</span>
            </button>
          )}
        </div>
      </div>

      {/* Monospace Telemetry Stream Container */}
      <div
        ref={scrollContainerRef}
        className={`p-4 overflow-y-auto min-h-[160px] ${maxHeight} divide-y divide-[#1e2329] text-xs leading-relaxed`}
      >
        {filteredLogs.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center text-[#646a78]">
            <TerminalIcon className="w-6 h-6 mb-2 opacity-50" />
            <p className="text-xs">
              {logs.length === 0
                ? 'Awaiting telemetry stream. Dispatch a mission to start logging.'
                : 'No log events match your current category and filter criteria.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const tag = resolveTag(log);
            const timeStr = formatTimestamp(log.timestamp);

            return (
              <div
                key={log.id || `log-${idx}`}
                className="py-1.5 flex items-start gap-2.5 hover:bg-[#1c2127]/60 px-1.5 rounded transition-colors"
              >
                {/* Timestamp */}
                <span className="text-[#646a78] text-[11px] shrink-0 tabular-nums select-none pt-0.5">
                  {timeStr}
                </span>

                {/* Step Tag */}
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 border ${tag.className}`}
                >
                  {tag.label}
                </span>

                {/* Log Message */}
                <span className="text-[#dcd6cd] text-[12px] break-all whitespace-pre-wrap flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MissionTerminal;
