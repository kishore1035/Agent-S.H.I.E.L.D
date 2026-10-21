'use client';
import React, { useState } from 'react';
import { Columns2, Rows2, TerminalSquare, CheckCircle2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';

type Line = { n: number; text: string; kind: 'same' | 'del' | 'add' };

const unified: Line[] = [
  { n: 1, text: 'import pandas as pd', kind: 'same' },
  { n: 2, text: 'import json', kind: 'same' },
  { n: 3, text: '', kind: 'same' },
  { n: 4, text: 'df = pd.read_csv("/sandbox/ro/sales_q3.csv")', kind: 'same' },
  { n: 5, text: 'baseline = json.load(open("/sandbox/ro/baseline.json"))', kind: 'same' },
  { n: 6, text: '', kind: 'same' },
  { n: 7, text: 'churn = df.groupby("region")["churned"].mean()', kind: 'del' },
  { n: 7, text: 'churn = df.groupby("region_id")["churned_at"].notna().groupby(df["region_id"]).mean()', kind: 'add' },
  { n: 8, text: 'sigma = churn.std()', kind: 'same' },
  { n: 9, text: 'flags = churn[(churn - baseline["overall"]).abs() > 1.5 * sigma]', kind: 'same' },
  { n: 10, text: 'print(json.dumps(sorted(flags.index.tolist())))', kind: 'same' },
];

const before = unified.filter((l) => l.kind !== 'add');
const after = unified.filter((l) => l.kind !== 'del');

const lineClass: Record<Line['kind'], string> = {
  same: 'bg-transparent',
  del: 'bg-destructive/10 text-destructive',
  add: 'bg-success/10 text-success',
};

const marker: Record<Line['kind'], string> = {
  same: ' ',
  del: '-',
  add: '+',
};

function CodeColumn({ title, lines, tone }: { title: string; lines: Line[]; tone: 'del' | 'add' }) {
  return (
    <div className="min-w-0 flex-1">
      <div
        className={`font-data border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider ${
          tone === 'del' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
        }`}
      >
        {title}
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        {lines.map((l) => (
          <div
            key={`${tone}-line-${l.n}-${l.kind}`}
            className={`font-data flex min-w-max text-xs leading-6 ${lineClass[l.kind]}`}
          >
            <span className="tabular w-10 shrink-0 select-none px-2 text-right text-muted-foreground">{l.n}</span>
            <span className="whitespace-pre pr-4">{l.text || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SelfHealDiff() {
  const [mode, setMode] = useState<'split' | 'unified'>('split');

  return (
    <Panel
      title="Self-healing diff"
      subtitle="Worker output → container stderr → healed rerun verified in Bubblewrap"
      action={
        <div className="flex rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setMode('split')}
            aria-pressed={mode === 'split'}
            className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-95 ${
              mode === 'split' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" /> Split
          </button>
          <button
            type="button"
            onClick={() => setMode('unified')}
            aria-pressed={mode === 'unified'}
            className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-95 ${
              mode === 'unified' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Rows2 className="h-3.5 w-3.5" /> Unified
          </button>
        </div>
      }
    >
      <div className="fade-in" key={mode}>
        {mode === 'split' ? (
          <div className="flex flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
            <CodeColumn title="Faulty code · attempt 1" lines={before} tone="del" />
            <CodeColumn title="Healed code · attempt 2" lines={after} tone="add" />
          </div>
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            {unified.map((l) => (
              <div
                key={`uni-line-${l.n}-${l.kind}`}
                className={`font-data flex min-w-max text-xs leading-6 ${lineClass[l.kind]}`}
              >
                <span className="tabular w-10 shrink-0 select-none px-2 text-right text-muted-foreground">{l.n}</span>
                <span className="w-5 shrink-0 select-none text-center">{marker[l.kind]}</span>
                <span className="whitespace-pre pr-4">{l.text || ' '}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <div className="flex items-center gap-2 border-b border-border bg-destructive/10 px-5 py-2">
          <TerminalSquare className="h-3.5 w-3.5 text-destructive" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
            stderr · exit code 1 · captured in container
          </p>
        </div>
        <pre className="font-data scrollbar-thin overflow-x-auto bg-background px-5 py-3 text-xs leading-6 text-destructive">
{`Traceback (most recent call last):
  File "/sandbox/work/main.py", line 7, in <module>
    churn = df.groupby("region")["churned"].mean()
  File ".../pandas/core/frame.py", line 8402, in groupby
KeyError: 'region'
  Hint: columns present = ['order_id', 'region_id', 'customer_id', 'mrr', 'churned_at']`}
        </pre>
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-success/10 px-5 py-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="font-medium text-success">Rerun passed · exit code 0</span>
          <span className="font-data text-muted-foreground">stdout: ["R-14","R-22","R-31","R-47"]</span>
          <span className="font-data ml-auto text-muted-foreground">healed in 1 attempt · 210ms</span>
        </div>
      </div>
    </Panel>
  );
}