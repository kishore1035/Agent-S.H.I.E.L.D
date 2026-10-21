import React, { useState, useMemo } from 'react';
import {
  Database,
  RotateCw,
  Search,
  Key,
  Clock,
  Bot,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
  FileJson,
  Layers,
} from 'lucide-react';
import type { BlackboardEntry } from '../../types/nexus';

export interface BlackboardTableProps {
  entries: BlackboardEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onEntryClick?: (entry: BlackboardEntry) => void;
  className?: string;
}

/**
 * Format timestamp into readable localized or ISO string
 */
function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

/**
 * Safely format value preview for collapsed rows
 */
function formatValuePreview(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    return value.length > 80 ? `"${value.slice(0, 80)}..."` : `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `Array(${value.length}) [ ${value.slice(0, 2).map((item) => typeof item === 'object' ? '{...}' : String(item)).join(', ')}${value.length > 2 ? ', ...' : ''} ]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return `{ ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''} } (${keys.length} keys)`;
  }
  return String(value);
}

export const BlackboardTable: React.FC<BlackboardTableProps> = ({
  entries,
  isLoading = false,
  onRefresh,
  onEntryClick,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Extract unique authors across all blackboard entries
  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    entries.forEach((e) => {
      if (e.author && e.author.trim()) authors.add(e.author.trim());
    });
    return Array.from(authors).sort();
  }, [entries]);

  // Total revision count across all keys
  const totalRevisions = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (curr.version || 1), 0);
  }, [entries]);

  // Filter entries by search query and author tag
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Author filter
      if (selectedAuthor && entry.author !== selectedAuthor) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesKey = entry.key.toLowerCase().includes(q);
        const matchesAuthor = entry.author?.toLowerCase().includes(q);
        let matchesValue = false;
        try {
          matchesValue = JSON.stringify(entry.value).toLowerCase().includes(q);
        } catch {
          matchesValue = false;
        }

        if (!matchesKey && !matchesAuthor && !matchesValue) {
          return false;
        }
      }

      return true;
    });
  }, [entries, searchQuery, selectedAuthor]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandedKeys.size === filteredEntries.length) {
      setExpandedKeys(new Set());
    } else {
      setExpandedKeys(new Set(filteredEntries.map((e) => e.key)));
    }
  };

  const handleCopyValue = async (entry: BlackboardEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const textToCopy =
        typeof entry.value === 'string'
          ? entry.value
          : JSON.stringify(entry.value, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(entry.key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === entry.key ? null : curr));
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAuthor(null);
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedAuthor);

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
      data-testid="blackboard-table"
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-paper border border-line text-gold">
            <Database className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
                Blackboard Store
              </h2>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-line bg-paper text-olive font-semibold">
                Shared Memory
              </span>
            </div>
            <p className="text-xs font-mono text-muted">
              Live key-value state synchronized across autonomous agents and supervisor
            </p>
          </div>
        </div>

        {/* Header Actions: Revision stats & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-line bg-paper text-xs font-mono text-muted tabular-nums">
            <Layers className="w-3 h-3 text-olive" />
            <span className="font-bold text-ink">{entries.length}</span> keys
            <span className="text-muted/60">·</span>
            <span className="font-medium text-ink">{totalRevisions}</span> revs
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh blackboard state"
              aria-label="Refresh blackboard"
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
            placeholder="Search by key, author, or JSON content..."
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

        {/* Author Filter Chips & Expand All Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {uniqueAuthors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap ${
                  selectedAuthor === null
                    ? 'bg-ink text-paper border-ink font-semibold shadow-2xs'
                    : 'bg-surface text-muted border-line hover:text-ink'
                }`}
              >
                All Authors
              </button>
              {uniqueAuthors.map((author) => {
                const isSelected = selectedAuthor === author;
                return (
                  <button
                    key={author}
                    type="button"
                    onClick={() => setSelectedAuthor(isSelected ? null : author)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-gold text-paper border-gold font-semibold shadow-2xs'
                        : 'bg-surface text-muted border-line hover:text-ink'
                    }`}
                  >
                    {author}
                  </button>
                );
              })}
            </div>
          )}

          {filteredEntries.length > 0 && (
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 rounded text-[11px] font-mono border border-line bg-surface text-muted hover:text-ink transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
              title="Expand or collapse all JSON viewers"
            >
              {expandedKeys.size === filteredEntries.length ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 flex-1">
        {entries.length === 0 ? (
          /* Empty State: No entries */
          <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center bg-paper/30 rounded-lg border border-line/60">
            <div className="w-12 h-12 rounded-full border border-line bg-paper flex items-center justify-center mb-3 text-muted shadow-2xs">
              <Database className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-1">
              Blackboard Memory Empty
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mb-5 leading-relaxed">
              No state has been posted to the shared blackboard. Dispatched agents write research findings,
              subtask results, and execution plans to this table in real-time.
            </p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-ink text-paper hover:bg-ink/90 font-mono text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Memory</span>
              </button>
            )}
          </div>
        ) : filteredEntries.length === 0 ? (
          /* Empty State: Search Miss */
          <div className="p-10 flex flex-col items-center justify-center text-center bg-paper/20 rounded-lg border border-line/60">
            <div className="w-10 h-10 rounded-full border border-line bg-paper flex items-center justify-center mb-2.5 text-muted">
              <Search className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-ink mb-1">
              No Matching Keys
            </h3>
            <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed">
              No blackboard entries match your search criteria.
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
          /* Rendered Entries List */
          <div className="flex flex-col gap-3">
            {filteredEntries.map((entry) => {
              const isExpanded = expandedKeys.has(entry.key);
              const isCopied = copiedKey === entry.key;
              const formattedJson =
                typeof entry.value === 'string'
                  ? entry.value
                  : JSON.stringify(entry.value, null, 2);

              return (
                <div
                  key={entry.key}
                  onClick={() => onEntryClick?.(entry)}
                  className={`border rounded-lg bg-surface transition-all duration-150 shadow-2xs overflow-hidden ${
                    isExpanded ? 'border-line shadow-xs' : 'border-line/80 hover:border-muted/60'
                  }`}
                  data-testid={`blackboard-entry-${entry.key}`}
                >
                  {/* Top Bar: Key name, Revision Badge, Author, Timestamp & Actions */}
                  <div
                    onClick={() => toggleExpand(entry.key)}
                    className="p-3.5 sm:px-4 bg-surface hover:bg-paper/30 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors border-b border-line/40"
                  >
                    {/* Left: Key Identifier + Revision Pill */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="p-1 rounded bg-paper border border-line text-olive shrink-0">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono font-bold text-ink text-xs sm:text-sm tracking-tight break-all">
                        {entry.key}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-olive/10 text-olive border border-olive/30 shadow-2xs tabular-nums"
                        title={`Revision version ${entry.version}`}
                      >
                        rev. {entry.version || 1}
                      </span>
                    </div>

                    {/* Right: Author Badge, Timestamp & Toggle Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
                      {/* Author Tag */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-paper border border-line text-[11px] font-mono text-muted">
                        <Bot className="w-3 h-3 text-gold shrink-0" />
                        <span className="text-ink font-medium">{entry.author || 'system'}</span>
                      </div>

                      {/* Timestamp */}
                      {entry.timestamp && (
                        <div
                          className="hidden md:flex items-center gap-1 text-[11px] font-mono text-muted tabular-nums"
                          title={entry.timestamp}
                        >
                          <Clock className="w-3 h-3 text-muted/70" />
                          <span>{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      )}

                      {/* Copy Action Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyValue(entry, e)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-green/10 text-green border-green/40 font-semibold'
                            : 'bg-paper text-muted hover:text-ink border-line hover:border-muted'
                        }`}
                        title="Copy entry value to clipboard"
                        aria-label="Copy entry value"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-green" />
                            <span className="text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px] hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>

                      {/* Expand / Collapse Indicator */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(entry.key);
                        }}
                        className="p-1 rounded text-muted hover:text-ink hover:bg-paper border border-line transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse JSON' : 'Expand JSON'}
                        aria-label={isExpanded ? 'Collapse JSON' : 'Expand JSON'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body: Value Preview or Formatted JSON Viewer */}
                  {isExpanded ? (
                    <div className="p-3.5 sm:p-4 bg-paper/20">
                      <div className="flex items-center justify-between pb-2 text-[11px] font-mono text-muted">
                        <div className="flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-olive" />
                          <span className="font-semibold uppercase tracking-wider text-[10px]">
                            Formatted JSON Payload
                          </span>
                        </div>
                        <span className="tabular-nums">
                          {formattedJson.split('\n').length} lines · {formattedJson.length} bytes
                        </span>
                      </div>

                      {/* Deep Forest Ink JSON Canvas */}
                      <div className="relative rounded-md border border-line/80 overflow-hidden shadow-2xs">
                        <pre className="p-3.5 bg-ink text-paper font-mono text-xs leading-relaxed overflow-x-auto selection:bg-olive selection:text-paper max-h-80">
                          <code>{formattedJson}</code>
                        </pre>
                        <button
                          type="button"
                          onClick={(e) => handleCopyValue(entry, e)}
                          className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-surface/90 hover:bg-surface text-ink text-[10px] font-mono border border-line shadow-xs cursor-pointer transition-colors"
                          title="Copy raw JSON"
                        >
                          {isCopied ? 'Copied!' : 'Copy JSON'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Compact Preview */
                    <div
                      onClick={() => toggleExpand(entry.key)}
                      className="px-4 py-2.5 bg-paper/30 flex items-center justify-between text-xs font-mono text-muted cursor-pointer hover:bg-paper/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate max-w-2xl">
                        <FileJson className="w-3 h-3 text-muted/70 shrink-0" />
                        <span className="text-ink/80 truncate">
                          {formatValuePreview(entry.value)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted hover:text-ink underline decoration-dotted shrink-0 hidden sm:inline">
                        View JSON
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackboardTable;
