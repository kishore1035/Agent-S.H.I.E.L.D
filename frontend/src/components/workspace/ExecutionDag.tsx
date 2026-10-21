import React, { useState } from 'react';
import {
  GitBranch,
  Cpu,
  Clock,
  CheckCircle2,
  Box,
  RotateCw,
  Tag,
  ArrowRight,
} from 'lucide-react';
import type { Subtask, SubtaskState } from '../../types/nexus';

export interface ExecutionDagProps {
  subtasks: Subtask[];
  selectedSubtaskId?: string;
  onSelectSubtask?: (subtask: Subtask) => void;
  className?: string;
}

function resolveState(subtask: Subtask): SubtaskState {
  return (subtask.state || subtask.status || 'PENDING') as SubtaskState;
}

function getStateBadge(state: SubtaskState) {
  switch (state) {
    case 'PENDING':
      return {
        label: 'PENDING',
        badgeClass:
          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
        ringClass: 'border-slate-300',
        icon: Clock,
        iconColor: 'text-slate-500',
      };
    case 'ROUTED':
      return {
        label: 'ROUTED',
        badgeClass:
          'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-400/40 animate-pulse',
        ringClass: 'border-indigo-400 ring-1 ring-indigo-300',
        icon: RotateCw,
        iconColor: 'text-indigo-600',
      };
    case 'SANDBOXED':
      return {
        label: 'SANDBOXED',
        badgeClass:
          'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/50',
        ringClass: 'border-amber-400 ring-2 ring-amber-300/60 shadow-amber-100',
        icon: Box,
        iconColor: 'text-amber-600',
      };
    case 'DONE':
      return {
        label: 'DONE',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        ringClass: 'border-emerald-400',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
      };
    default:
      return {
        label: state,
        badgeClass: 'bg-paper text-muted border-line',
        ringClass: 'border-line',
        icon: Clock,
        iconColor: 'text-muted',
      };
  }
}

export const ExecutionDag: React.FC<ExecutionDagProps> = ({
  subtasks,
  selectedSubtaskId,
  onSelectSubtask,
  className = '',
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null
  );

  const activeSelectedId = selectedSubtaskId ?? internalSelectedId;

  const handleNodeClick = (subtask: Subtask) => {
    setInternalSelectedId(
      activeSelectedId === subtask.id ? null : subtask.id
    );
    if (onSelectSubtask) {
      onSelectSubtask(subtask);
    }
  };

  const doneCount = subtasks.filter(
    (st) => resolveState(st) === 'DONE'
  ).length;
  const progressPercent =
    subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
      data-testid="execution-dag"
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-4 h-4 text-olive" />
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Execution DAG
          </h2>
          <span className="hidden sm:inline-block text-xs font-mono text-muted">
            / Subtask Dependency Graph
          </span>
        </div>

        {/* Pipeline Summary Counters */}
        <div className="flex items-center gap-3">
          {subtasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted">Progress:</span>
              <div className="w-24 h-2 bg-paper rounded-full border border-line overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-semibold text-ink tabular-nums">
                {progressPercent}%
              </span>
            </div>
          )}

          <div className="px-2 py-0.5 rounded border border-line bg-paper text-xs font-mono text-muted tabular-nums">
            {subtasks.length} {subtasks.length === 1 ? 'node' : 'nodes'}
          </div>
        </div>
      </div>

      {/* Main DAG Content Canvas */}
      {subtasks.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-paper/30">
          <div className="w-12 h-12 rounded-full border border-line bg-paper flex items-center justify-center mb-3 text-muted">
            <GitBranch className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-base sm:text-lg font-semibold text-ink mb-1">
            Pipeline Awaiting Dispatch
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mb-6 leading-relaxed">
            Dispatch a prompt in the Mission Composer. Nexus TaskPlanner will
            decompose your request into isolated subtasks and track state
            transitions in real-time.
          </p>

          {/* Educational lifecycle preview */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-surface border border-line rounded-md text-xs font-mono text-muted">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
              PENDING
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-line" />
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-300">
              ROUTED
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-line" />
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 ring-1 ring-amber-400">
              SANDBOXED
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-line" />
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
              DONE
            </span>
          </div>
        </div>
      ) : (
        /* Rendered Visual DAG */
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="flex items-center min-w-max py-2 px-1">
            {subtasks.map((subtask, index) => {
              const state = resolveState(subtask);
              const badge = getStateBadge(state);
              const StateIcon = badge.icon;
              const isSelected = activeSelectedId === subtask.id;
              const isLast = index === subtasks.length - 1;

              const worker =
                subtask.assignedWorker ||
                subtask.worker_id ||
                'Pending Assignment';

              return (
                <React.Fragment key={subtask.id}>
                  {/* Subtask Node Card */}
                  <div
                    onClick={() => handleNodeClick(subtask)}
                    className={`relative w-64 p-4 rounded-lg border bg-surface transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-olive ring-2 ring-olive/40'
                        : badge.ringClass
                    }`}
                  >
                    {/* Top Row: Index Badge & State Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Step 0{index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.badgeClass}`}
                      >
                        <StateIcon
                          className={`w-3 h-3 ${badge.iconColor} ${
                            state === 'ROUTED' ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Subtask Identifier */}
                    <div className="font-mono text-xs font-bold text-ink mb-1 truncate" title={subtask.id}>
                      {subtask.id}
                    </div>

                    {/* Subtask Description */}
                    <p className="text-xs text-muted line-clamp-2 mb-3 leading-relaxed" title={subtask.description}>
                      {subtask.description}
                    </p>

                    {/* Assigned Worker Badge */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-paper/60 rounded border border-line/70 text-[11px] font-mono text-ink">
                      <Cpu className="w-3.5 h-3.5 text-olive shrink-0" />
                      <span className="truncate" title={worker}>
                        {worker}
                      </span>
                    </div>

                    {/* Tags List */}
                    {subtask.tags && subtask.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {subtask.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-paper text-[10px] font-mono text-muted border border-line"
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Execution time indicator if present */}
                    {subtask.executionTimeMs !== undefined && (
                      <div className="mt-2 text-[10px] font-mono text-muted text-right tabular-nums">
                        {subtask.executionTimeMs}ms
                      </div>
                    )}
                  </div>

                  {/* Smooth SVG Connector Path to Next Node */}
                  {!isLast && (
                    <div
                      className="flex items-center justify-center px-1.5 shrink-0"
                      aria-hidden="true"
                    >
                      <svg
                        width="44"
                        height="36"
                        viewBox="0 0 44 36"
                        className="overflow-visible"
                      >
                        <defs>
                          <marker
                            id={`dag-arrow-${index}`}
                            viewBox="0 0 10 10"
                            refX="7"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                          >
                            <path
                              d="M 0 1.5 L 8 5 L 0 8.5 z"
                              fill={
                                state === 'DONE'
                                  ? '#168343'
                                  : state === 'SANDBOXED' || state === 'ROUTED'
                                    ? '#64864d'
                                    : '#b4b0a7'
                              }
                            />
                          </marker>
                        </defs>
                        {/* Smooth Cubic Bezier Connector Line */}
                        <path
                          d="M 2 18 C 16 18, 28 18, 40 18"
                          fill="none"
                          stroke={
                            state === 'DONE'
                              ? '#168343'
                              : state === 'SANDBOXED'
                                ? '#b67922'
                                : state === 'ROUTED'
                                  ? '#64864d'
                                  : '#d8d4cb'
                          }
                          strokeWidth="2.5"
                          strokeDasharray={
                            state === 'ROUTED'
                              ? '4 2'
                              : state === 'PENDING'
                                ? '3 3'
                                : undefined
                          }
                          markerEnd={`url(#dag-arrow-${index})`}
                          className={
                            state === 'ROUTED' ? 'animate-pulse' : undefined
                          }
                        />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Selected Subtask Detail Drawer */}
          {activeSelectedId && (
            <div className="mt-4 p-4 bg-paper/60 border border-line rounded-md text-xs font-mono">
              {(() => {
                const selected = subtasks.find(
                  (st) => st.id === activeSelectedId
                );
                if (!selected) return null;
                const state = resolveState(selected);
                return (
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
                      <span className="font-bold text-ink">
                        Node Inspection: {selected.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInternalSelectedId(null)}
                        className="text-muted hover:text-ink cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted">
                      <div>
                        <span className="font-semibold text-ink">State: </span>
                        <span>{state}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-ink">Worker: </span>
                        <span>
                          {selected.assignedWorker ||
                            selected.worker_id ||
                            'Unassigned'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-ink">Goal: </span>
                        <span>{selected.description}</span>
                      </div>
                      {selected.result && (
                        <div className="sm:col-span-2 mt-1">
                          <span className="font-semibold text-ink">Output:</span>
                          <pre className="p-2 bg-surface border border-line rounded mt-1 overflow-x-auto text-[11px] text-ink whitespace-pre-wrap">
                            {selected.result}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionDag;
