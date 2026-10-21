'use client';
import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { waterfallSpans } from '@/lib/mockData';

const fillVar: Record<string, string> = {
  routed: 'var(--routed)',
  accent: 'var(--accent)',
  sandboxing: 'var(--sandboxing)',
  healed: 'var(--healed)',
  completed: 'var(--completed)',
};

interface TipProps {
  active?: boolean;
  payload?: { payload: { name: string; offset: number; duration: number } }[];
}

function WaterfallTooltip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{d.name}</p>
      <p className="font-data text-muted-foreground">
        +{d.offset}ms → {d.offset + d.duration}ms
      </p>
      <p className="tabular font-data font-semibold">{d.duration}ms</p>
    </div>
  );
}

export default function WaterfallChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallSpans} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }} barCategoryGap={10}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 800]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            tickFormatter={(v: number) => `${v}ms`}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: 'var(--foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<WaterfallTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Bar dataKey="offset" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="duration" stackId="w" radius={[3, 3, 3, 3]} minPointSize={3}>
            {waterfallSpans.map((s) => (
              <Cell key={`cell-${s.name}`} fill={fillVar[s.fill]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}