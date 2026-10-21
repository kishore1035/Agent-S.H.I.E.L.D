import React, { useState, useMemo } from 'react';
import {
  Cpu,
  RotateCw,
  Search,
  Clock,
  Tag,
  Code,
  BookOpen,
  Database,
  Server,
  X,
  SlidersHorizontal,
  Bot,
  ExternalLink,
} from 'lucide-react';
import type { AgentManifest } from '../../types/nexus';

export interface WorkerMatrixProps {
  workers: AgentManifest[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectWorker?: (worker: AgentManifest) => void;
  selectedWorkerId?: string;
  className?: string;
}

/**
 * Maps worker capabilities or ID to an icon and thematic accent styling
 */
function getWorkerTheme(worker: AgentManifest) {
  const idLower = worker.id.toLowerCase();
  const caps = (worker.capabilities || []).map((c) => c.toLowerCase());

  if (idLower.includes('code') || idLower.includes('coding') || caps.includes('code')) {
    return {
      icon: Code,
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      iconBg: 'bg-indigo-100 text-indigo-800',
      accentLabel: 'Coding & Synthesis',
    };
  }

  if (idLower.includes('research') || caps.includes('research') || caps.includes('search')) {
    return {
      icon: BookOpen,
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      iconBg: 'bg-amber-100 text-amber-800',
      accentLabel: 'Information Retrieval',
    };
  }

  if (idLower.includes('data') || caps.includes('data') || caps.includes('analytics')) {
    return {
      icon: Database,
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-800',
      accentLabel: 'Dataset Pipeline',
    };
  }

  if (idLower.includes('ops') || caps.includes('ops') || caps.includes('devops')) {
    return {
      icon: Server,
      badgeBg: 'bg-slate-100 border-slate-300 text-slate-800',
      iconBg: 'bg-slate-200 text-slate-800',
      accentLabel: 'Infrastructure & Ops',
    };
  }

  return {
    icon: Bot,
    badgeBg: 'bg-paper border-line text-ink',
    iconBg: 'bg-paper text-olive',
    accentLabel: 'Autonomous Agent',
  };
}

export const WorkerMatrix: React.FC<WorkerMatrixProps> = ({
  workers,
  isLoading = false,
  onRefresh,
  onSelectWorker,
  selectedWorkerId,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);

  // Extract unique capability tags across all registered workers
  const uniqueCapabilities = useMemo(() => {
    const caps = new Set<string>();
    workers.forEach((w) => {
      if (Array.isArray(w.capabilities)) {
        w.capabilities.forEach((c) => {
          if (c && c.trim()) caps.add(c.trim());
        });
      }
    });
    return Array.from(caps).sort();
  }, [workers]);

  // Filter workers by query string and selected capability
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      // Capability filter
      if (selectedCapability && !worker.capabilities?.includes(selectedCapability)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = worker.name.toLowerCase().includes(q);
        const matchesId = worker.id.toLowerCase().includes(q);
        const matchesVersion = worker.version?.toLowerCase().includes(q);
        const matchesCap = worker.capabilities?.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesId && !matchesVersion && !matchesCap) {
          return false;
        }
      }

      return true;
    });
  }, [workers, searchQuery, selectedCapability]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCapability(null);
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedCapability);

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
      data-testid="worker-matrix"
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-paper border border-line text-olive">
            <Cpu className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
                Worker Matrix
              </h2>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-line bg-paper text-gold font-semibold">
                App Store
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Autonomous execution units discovered and registered in Nexus AppStore
            </p>
          </div>
        </div>

        {/* Header Actions: Count badge & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded border border-line bg-paper text-xs font-mono text-muted tabular-nums">
            <span className="font-bold text-ink">{filteredWorkers.length}</span> of{' '}
            <span>{workers.length}</span> {workers.length === 1 ? 'worker' : 'workers'}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh registered workers"
              aria-label="Refresh workers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-paper text-xs font-mono text-ink hover:bg-surface hover:text-olive transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-olive' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 sm:px-5 border-b border-line bg-paper/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers by name, ID, or capability..."
            className="w-full pl-9 pr-8 py-1.5 bg-surface border border-line rounded-md font-mono text-xs text-ink placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-olive focus:border-olive transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-ink rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Capability Filter Chips */}
        {uniqueCapabilities.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <SlidersHorizontal className="w-3 h-3 text-muted shrink-0 hidden md:inline-block" />
            <button
              type="button"
              onClick={() => setSelectedCapability(null)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide border transition-all cursor-pointer whitespace-nowrap ${
                selectedCapability === null
                  ? 'bg-ink text-paper border-ink font-semibold shadow-2xs'
                  : 'bg-surface text-muted border-line hover:text-ink hover:border-muted/60'
              }`}
            >
              All Tags
            </button>
            {uniqueCapabilities.map((cap) => {
              const isSelected = selectedCapability === cap;
              const count = workers.filter((w) => w.capabilities?.includes(cap)).length;
              return (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setSelectedCapability(isSelected ? null : cap)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-olive text-paper border-olive font-semibold shadow-2xs'
                      : 'bg-surface text-muted border-line hover:text-ink hover:border-muted/60'
                  }`}
                >
                  <span>{cap}</span>
                  <span
                    className={`text-[9px] px-1 rounded ${
                      isSelected ? 'bg-black/20 text-paper' : 'bg-paper text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid Canvas */}
      <div className="p-4 sm:p-6 flex-1">
        {workers.length === 0 ? (
          /* Empty State: No Workers in Hub */
          <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center bg-paper/30 rounded-lg border border-line/60">
            <div className="w-12 h-12 rounded-full border border-line bg-paper flex items-center justify-center mb-3 text-muted shadow-2xs">
              <Cpu className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-1">
              No Registered Workers Found
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mb-5 leading-relaxed">
              Nexus AppStore contains no registered agent manifests. Register workers in your Nexus runtime
              daemon using <code className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink font-mono text-[11px]">app_store.register()</code> to enable autonomous orchestration.
            </p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-ink text-paper hover:bg-ink/90 font-mono text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reload Registry</span>
              </button>
            )}
          </div>
        ) : filteredWorkers.length === 0 ? (
          /* Empty State: Query Miss */
          <div className="p-10 flex flex-col items-center justify-center text-center bg-paper/20 rounded-lg border border-line/60">
            <div className="w-10 h-10 rounded-full border border-line bg-paper flex items-center justify-center mb-2.5 text-muted">
              <Search className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-ink mb-1">
              No Matching Workers
            </h3>
            <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed">
              No agent matches your current search criteria. Try adjusting your query or resetting tag filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 rounded-md border border-line bg-surface text-xs font-mono text-ink hover:border-muted font-medium cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Rendered Grid of Worker Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => {
              const theme = getWorkerTheme(worker);
              const WorkerIcon = theme.icon;
              const isSelected = selectedWorkerId === worker.id;

              return (
                <div
                  key={worker.id}
                  onClick={() => onSelectWorker?.(worker)}
                  className={`flex flex-col justify-between p-5 rounded-lg border bg-surface transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer relative group ${
                    isSelected
                      ? 'border-olive ring-2 ring-olive/40 bg-olive/[0.02]'
                      : 'border-line hover:border-muted/60'
                  }`}
                  data-testid={`worker-card-${worker.id}`}
                >
                  {/* Card Top Row: Avatar Icon, Name, ID & Version */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${theme.badgeBg}`}
                        >
                          <WorkerIcon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h3 className="font-serif text-base font-semibold text-ink tracking-tight group-hover:text-olive transition-colors">
                            {worker.name}
                          </h3>
                          <div className="font-mono text-xs text-muted tracking-tight truncate max-w-[170px]" title={worker.id}>
                            {worker.id}
                          </div>
                        </div>
                      </div>

                      {/* Version Tag */}
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-line bg-paper text-gold shadow-2xs shrink-0">
                        v{worker.version || '1.0.0'}
                      </span>
                    </div>

                    {/* Accent label */}
                    <div className="mb-3">
                      <span className="text-[11px] font-mono text-muted tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-olive/60" />
                        {theme.accentLabel}
                      </span>
                    </div>

                    {/* Capabilities Tags List */}
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                        Declared Capabilities:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {worker.capabilities && worker.capabilities.length > 0 ? (
                          worker.capabilities.map((cap) => {
                            const isTagMatched =
                              selectedCapability === cap ||
                              (searchQuery.trim() !== '' &&
                                cap.toLowerCase().includes(searchQuery.toLowerCase().trim()));

                            return (
                              <span
                                key={cap}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                                  isTagMatched
                                    ? 'bg-olive/15 text-ink border-olive/50 font-semibold ring-1 ring-olive/30'
                                    : 'bg-paper text-ink border-line'
                                }`}
                              >
                                <Tag className="w-2.5 h-2.5 opacity-60 text-muted" />
                                <span>{cap}</span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs font-mono text-muted italic">
                            No capabilities declared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Row: Timeout & Online Status */}
                  <div className="pt-3 border-t border-line/70 flex items-center justify-between text-xs font-mono text-muted">
                    {/* Execution Timeout */}
                    <div
                      className="flex items-center gap-1.5"
                      title="Maximum execution timeout before watchdog abort"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted opacity-80" />
                      <span className="tabular-nums font-medium text-ink">
                        {worker.timeout_secs}s
                      </span>
                      <span>timeout</span>
                    </div>

                    {/* Health Status Indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2" aria-hidden="true">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-ink font-semibold">
                        Ready
                      </span>
                      {onSelectWorker && (
                        <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMatrix;
