'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Panel from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { waterfallSpans } from '@/lib/mockData';

const WaterfallChart = dynamic(() => import('@/app/execution-inspector/components/WaterfallChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

const spanTone: Record<string, string> = {
  routed: 'bg-routed',
  accent: 'bg-accent',
  sandboxing: 'bg-sandboxing',
  healed: 'bg-healed',
  completed: 'bg-completed',
};

export default function LatencyWaterfall() {
  const total = waterfallSpans.reduce((s, x) => Math.max(s, x.offset + x.duration), 0);

  return (
    <Panel
      title="Latency waterfall"
      subtitle={`Trace 4e7a91c0b2 · total ${total}ms · OpenTelemetry spans`}
      action={<span className="font-data text-xs text-muted-foreground">p95 budget 1,000ms</span>}
    >
      <div className="grid grid-cols-1 gap-0 xl:grid-cols-3 2xl:grid-cols-3">
        <div className="p-5 xl:col-span-2">
          <WaterfallChart />
        </div>
        <ul className="border-t border-border xl:border-l xl:border-t-0">
          {waterfallSpans.map((s, i) => (
            <li
              key={`span-${s.name}`}
              className={`flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-muted/50 ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className={`h-3 w-3 shrink-0 rounded-sm ${spanTone[s.fill]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="font-data text-[11px] text-muted-foreground">
                  starts +{s.offset}ms · {Math.round((s.duration / total) * 100)}% of trace
                </p>
              </div>
              <p className="tabular font-data text-sm font-semibold">{s.duration}ms</p>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3">
            <p className="text-sm font-semibold">End-to-end</p>
            <p className="tabular font-data text-sm font-bold">{total}ms</p>
          </li>
        </ul>
      </div>
    </Panel>
  );
}