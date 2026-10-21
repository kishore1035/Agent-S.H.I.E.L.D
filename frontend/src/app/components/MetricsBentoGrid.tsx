import React from 'react';
import { Activity, Coins, Wrench, Timer, ShieldCheck, FileSignature, AlertTriangle } from 'lucide-react';
import TokenBurnChart from '@/app/components/TokenBurnChart';
import IsolationRadial from '@/app/components/IsolationRadial';

const labelCls = 'text-xs font-semibold text-muted-foreground';
const cardCls = 'rounded-lg border border-border bg-card p-5 shadow-card transition-shadow duration-300 hover:shadow-lift';

export default function MetricsBentoGrid() {
  return (
    <section aria-label="Run health" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Run health</h2>
        <p className="text-xs text-muted-foreground">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
          Live
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
        {/* Hero — active run */}
        <div className="accent-gradient relative overflow-hidden rounded-lg p-6 text-white shadow-lift md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-white/70">Active run · run-8f21c4</p>
              <p className="tabular mt-2 text-5xl font-extrabold tracking-tight">
                4<span className="text-white/60">/7</span>
                <span className="ml-2 text-base font-medium text-white/70">subtasks done</span>
              </p>
            </div>
            <Activity className="h-5 w-5 text-white/80" />
          </div>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[43%] bg-white" />
            <div className="h-full w-[14%] bg-white/70" />
            <div className="h-full w-[14%] bg-white/45" />
            <div className="h-full w-[14%] bg-white/25" />
          </div>
          <p className="mt-3 text-xs text-white/70">3 completed · 1 healed · 1 sandboxing · 1 routed · 1 pending</p>
        </div>

        {/* Token cost with chart */}
        <div className={cardCls}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>Token spend</p>
            <Coins className="h-4 w-4 text-warning" />
          </div>
          <p className="tabular mt-2 text-3xl font-bold">$0.112</p>
          <p className="text-xs text-muted-foreground">9,661 tokens · budget 40,000</p>
          <TokenBurnChart />
        </div>

        {/* Self-heal rate */}
        <div className={cardCls}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>Self-heal rate</p>
            <Wrench className="h-4 w-4 text-healed" />
          </div>
          <p className="tabular mt-2 text-3xl font-bold text-healed">14.3%</p>
          <p className="mt-1 text-xs text-muted-foreground">1 of 7 subtasks needed repair</p>
          <p className="mt-3 text-xs text-muted-foreground">7-day avg 9.8%</p>
        </div>

        {/* p95 latency */}
        <div className={cardCls}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>P95 latency</p>
            <Timer className="h-4 w-4 text-routed" />
          </div>
          <p className="tabular mt-2 text-3xl font-bold">1.36s</p>
          <p className="mt-1 text-xs text-muted-foreground">p50 640ms · SLA 2.0s</p>
          <p className="mt-3 text-xs font-medium text-success">↓ 212ms vs yesterday</p>
        </div>

        {/* Isolation coverage */}
        <div className={cardCls}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>Sandbox isolation</p>
            <ShieldCheck className="h-4 w-4 text-completed" />
          </div>
          <IsolationRadial />
          <p className="text-xs text-muted-foreground">Network isolated on 11 of 12 runs</p>
        </div>

        {/* Receipt alert card */}
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 md:col-span-2">
          <div className="flex items-start justify-between">
            <p className={labelCls}>Receipt verification</p>
            <FileSignature className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="tabular text-3xl font-bold text-destructive">1 failed</p>
            <p className="tabular text-sm text-muted-foreground">7 verified · 1 pending</p>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md bg-card px-3 py-2.5 text-xs shadow-card">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>
              <span className="font-data font-medium">run-8ed90f</span> payload digest does not match the signed
              SHA-256. Open the Inspector to re-verify.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}