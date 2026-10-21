'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, User, Clock, Coins, ExternalLink } from 'lucide-react';
import Badge, { statusTone } from '@/components/ui/Badge';
import { DagNode } from '@/lib/mockData';

interface NodeDrawerProps {
  node: DagNode | null;
  onClose: () => void;
}

export default function NodeDrawer({ node, onClose }: NodeDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="fade-in absolute inset-0 bg-foreground/30"
      />
      <aside
        role="dialog"
        aria-label={`Subtask ${node.id}`}
        className="slide-in-right relative flex h-full w-full max-w-md flex-col border-l border-border bg-card text-card-foreground shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="font-data text-xs text-muted-foreground">{node.id}</p>
            <h3 className="font-display text-2xl font-medium">{node.label}</h3>
            <div className="mt-2">
              <Badge tone={statusTone(node.status)}>{node.status}</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-border bg-background p-3">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="mt-1 text-[11px] text-muted-foreground">Worker</p>
              <p className="text-sm font-medium leading-tight">{node.worker}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="mt-1 text-[11px] text-muted-foreground">Latency</p>
              <p className="tabular font-data text-sm font-medium">{node.latencyMs ? `${node.latencyMs}ms` : '—'}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="mt-1 text-[11px] text-muted-foreground">Tokens</p>
              <p className="tabular font-data text-sm font-medium">{node.tokens ? node.tokens.toLocaleString('en-US') : '—'}</p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">Subtask prompt</p>
            <p className="font-data rounded-md border border-border bg-background p-3 text-xs leading-relaxed">
              {node.prompt}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">Model output</p>
            <p className="font-data rounded-md border border-border bg-background p-3 text-xs leading-relaxed">
              {node.output}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">Depends on</p>
            {node.deps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upstream dependencies — this is the DAG root.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {node.deps.map((d) => (
                  <Badge key={`dep-${node.id}-${d}`} tone="neutral">
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-border px-5 py-3">
          <Link
            href="/execution-inspector"
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95"
          >
            Open in Execution Inspector <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </aside>
    </div>
  );
}