'use client';
import React, { useEffect, useState } from 'react';
import { BookOpen, PenLine, History } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Badge from '@/components/ui/Badge';
import { BbKey } from '@/lib/mockData';

interface KeyDetailProps {
  bbKey: BbKey;
  flash: boolean;
}

function prettify(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function tokenize(text: string) {
  return text.split('\n');
}

export default function KeyDetail({ bbKey, flash }: KeyDetailProps) {
  const total = bbKey.revisions.length;
  const [rev, setRev] = useState(total);

  useEffect(() => {
    setRev(total);
  }, [bbKey.path, total]);

  const current = bbKey.revisions[rev - 1];
  const previous = rev > 1 ? bbKey.revisions[rev - 2] : null;

  const curLines = tokenize(prettify(current.value));
  const prevLines = previous ? tokenize(prettify(previous.value)) : [];
  const prevSet = new Set(prevLines);
  const curSet = new Set(curLines);

  return (
    <Panel
      title={bbKey.path.split('/').pop() ?? bbKey.path}
      subtitle={bbKey.path}
      action={<Badge tone="accent">{bbKey.type}</Badge>}
    >
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" /> LAST WRITER
            </p>
            <Badge tone="healed" mono={false} className="normal-case">
              {bbKey.writer}
            </Badge>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> READERS ({bbKey.readers.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bbKey.readers.length === 0 ? (
                <span className="text-xs text-muted-foreground">No agent has read this key yet.</span>
              ) : (
                bbKey.readers.map((r) => (
                  <Badge key={`reader-${bbKey.path}-${r}`} tone="routed" mono={false} className="normal-case">
                    {r}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> REVISION HISTORY
            </p>
            <p className="font-data text-xs">
              <span className="font-semibold">v{rev}</span>
              <span className="text-muted-foreground"> of v{total}</span>
            </p>
          </div>
          <input
            type="range"
            min={1}
            max={total}
            step={1}
            value={rev}
            onChange={(e) => setRev(Number(e.target.value))}
            disabled={total === 1}
            aria-label="Revision"
            className="h-2 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <div className="font-data mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            {bbKey.revisions.map((r) => (
              <button
                key={`rev-${bbKey.path}-${r.v}`}
                type="button"
                onClick={() => setRev(r.v)}
                className={`rounded-sm px-1.5 py-0.5 transition-colors duration-150 hover:bg-muted ${
                  r.v === rev ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                v{r.v}
              </button>
            ))}
          </div>
          <p className="font-data mt-2 text-xs text-muted-foreground">
            written {current.at} UTC by <span className="font-semibold text-foreground">{current.by}</span>
          </p>
        </div>

        <div className={flash ? 'value-flash rounded-md' : ''}>
          <p className="mb-2 text-[13px] font-medium tracking-wide text-muted-foreground">
            {previous ? `DIFF v${rev - 1} → v${rev}` : `VALUE · v${rev} (initial write)`}
          </p>
          <div className="scrollbar-thin overflow-x-auto rounded-md border border-border bg-background">
            {previous &&
              prevLines
                .filter((l) => !curSet.has(l))
                .map((l, i) => (
                  <div key={`del-${bbKey.path}-${rev}-${i + 1}`} className="font-data flex min-w-max bg-destructive/10 text-xs leading-6 text-destructive">
                    <span className="w-6 shrink-0 select-none text-center">-</span>
                    <span className="whitespace-pre pr-4">{l}</span>
                  </div>
                ))}
            {curLines.map((l, i) => {
              const added = previous ? !prevSet.has(l) : true;
              return (
                <div
                  key={`cur-${bbKey.path}-${rev}-${i + 1}`}
                  className={`font-data flex min-w-max text-xs leading-6 ${added ? 'bg-success/10 text-success' : ''}`}
                >
                  <span className="w-6 shrink-0 select-none text-center">{added ? '+' : ' '}</span>
                  <span className="whitespace-pre pr-4">{l}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}