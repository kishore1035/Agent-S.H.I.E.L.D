'use client';
import React from 'react';
import { Coins } from 'lucide-react';
import { useProvider } from '@/components/ProviderContext';

export default function CostMeter() {
  const { tokens, budget, cost } = useProvider();
  const pct = Math.min(100, Math.round((tokens / budget) * 100));
  return (
    <div className="hidden items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-1.5 lg:flex" title="Tokens used against run budget">
      <Coins className="h-3.5 w-3.5 text-warning" />
      <div className="leading-tight">
        <p className="font-data tabular text-[11px] font-medium">
          {tokens?.toLocaleString('en-US')} <span className="text-muted-foreground">/ {budget?.toLocaleString('en-US')} tok</span>
        </p>
        <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="font-data tabular text-xs font-semibold">${cost?.toFixed(3)}</p>
    </div>
  );
}