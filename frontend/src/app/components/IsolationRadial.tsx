'use client';
import React from 'react';
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const data = [{ name: 'isolation', value: 92 }];

export default function IsolationRadial() {
  return (
    <div className="relative my-1 h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="70%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          cy="90%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} fill="var(--completed)" background={{ fill: 'var(--muted)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="tabular absolute inset-x-0 bottom-0 text-center text-2xl font-bold">92%</p>
    </div>
  );
}