'use client';
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { tokenBurn } from '@/lib/mockData';

function BurnTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-data text-muted-foreground">{label}</p>
      <p className="tabular font-semibold">{payload[0].value.toLocaleString('en-US')} tok</p>
    </div>
  );
}

export default function TokenBurnChart() {
  return (
    <div className="mt-2 h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={tokenBurn} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--warning)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <Tooltip content={<BurnTooltip />} />
          <Area type="monotone" dataKey="tokens" stroke="var(--warning)" strokeWidth={1.75} fill="url(#burnFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}