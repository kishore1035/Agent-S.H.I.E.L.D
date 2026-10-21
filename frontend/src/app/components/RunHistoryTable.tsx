'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, FileSearch, Search, SearchX } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Badge, { statusTone } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { runs, RunRow } from '@/lib/mockData';

type SortKey = 'startedAt' | 'tokens' | 'cost' | 'latencyMs' | 'healed';

const columns: { key: string; label: string; sortable?: SortKey; align?: 'right' }[] = [
  { key: 'id', label: 'Run ID' },
  { key: 'task', label: 'Task' },
  { key: 'subtasks', label: 'Subtasks', align: 'right' },
  { key: 'healed', label: 'Healed', sortable: 'healed', align: 'right' },
  { key: 'model', label: 'Model' },
  { key: 'tokens', label: 'Tokens', sortable: 'tokens', align: 'right' },
  { key: 'cost', label: 'Cost', sortable: 'cost', align: 'right' },
  { key: 'latency', label: 'Latency', sortable: 'latencyMs', align: 'right' },
  { key: 'receipt', label: 'Receipt' },
];

export default function RunHistoryTable() {
  const [query, setQuery] = useState('');
  const [receipt, setReceipt] = useState<'all' | RunRow['receipt']>('all');
  const [sortKey, setSortKey] = useState<SortKey>('startedAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = runs.filter(
      (r) =>
        (receipt === 'all' || r.receipt === receipt) &&
        (q === '' || r.task.toLowerCase().includes(q) || r.id.includes(q) || r.model.toLowerCase().includes(q)),
    );
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [query, receipt, sortKey, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setDir('desc');
    }
    setPage(1);
  };

  return (
    <Panel title="Results & receipts" subtitle={`${filtered.length} runs · signed with Ed25519`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <label className="relative">
          <span className="sr-only">Search runs</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search task, run ID, model…"
            className="w-64 rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm outline-none transition-shadow duration-150 focus:border-accent focus:ring-2 focus:ring-ring/20"
          />
        </label>
        <div className="flex items-center gap-1">
          {(['all', 'verified', 'pending', 'failed'] as const).map((f) => (
            <button
              key={`filter-${f}`}
              type="button"
              onClick={() => {
                setReceipt(f);
                setPage(1);
              }}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 active:scale-95 ${
                receipt === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-input'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {slice.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="No runs match these filters"
          description="Try clearing the receipt filter or searching a different task keyword."
          actionLabel="Reset filters"
          onAction={() => {
            setQuery('');
            setReceipt('all');
          }}
        />
      ) : (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {columns.map((c) => (
                  <th
                    key={`col-${c.key}`}
                    scope="col"
                    className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                      c.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.sortable as SortKey)}
                        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                          sortKey === c.sortable ? 'text-foreground' : ''
                        }`}
                      >
                        {c.label}
                        {sortKey === c.sortable && (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={`run-${r.id}`} className="group border-b border-border transition-colors duration-150 last:border-0 hover:bg-muted/50">
                  <td className="font-data whitespace-nowrap px-4 py-3 text-xs">{r.id}</td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate font-medium" title={r.task}>{r.task}</p>
                    <p className="font-data text-[11px] text-muted-foreground">{r.startedAt}</p>
                  </td>
                  <td className="tabular px-4 py-3 text-right">{r.subtasks}</td>
                  <td className="tabular px-4 py-3 text-right">
                    {r.healed > 0 ? <Badge tone="healed">{r.healed} healed</Badge> : <span className="text-muted-foreground">0</span>}
                  </td>
                  <td className="font-data whitespace-nowrap px-4 py-3 text-xs">{r.model}</td>
                  <td className="tabular font-data px-4 py-3 text-right text-xs">{r.tokens.toLocaleString('en-US')}</td>
                  <td className="tabular font-data px-4 py-3 text-right text-xs">{r.cost === 0 ? 'free' : `$${r.cost.toFixed(4)}`}</td>
                  <td className="tabular font-data px-4 py-3 text-right text-xs">{r.latencyMs.toLocaleString('en-US')}ms</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(r.receipt)}>{r.receipt}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <Link
                        href="/execution-inspector"
                        title="Open in inspector"
                        aria-label={`Inspect ${r.id}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-card hover:text-foreground active:scale-95"
                      >
                        <FileSearch className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/execution-inspector"
                        title="Verify receipt"
                        aria-label={`Verify receipt for ${r.id}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-card hover:text-foreground active:scale-95"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label htmlFor="page-size">Rows</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          >
            {[5, 10, 20].map((n) => (
              <option key={`size-${n}`} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="tabular">
            {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            aria-label="Previous page"
            className="rounded-md border border-border p-1.5 transition-all duration-150 hover:border-input active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => setPage(p)}
              className={`tabular h-8 w-8 rounded-md border text-xs font-medium transition-all duration-150 active:scale-95 ${
                p === safePage ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-input'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage === pages}
            onClick={() => setPage(safePage + 1)}
            aria-label="Next page"
            className="rounded-md border border-border p-1.5 transition-all duration-150 hover:border-input active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}