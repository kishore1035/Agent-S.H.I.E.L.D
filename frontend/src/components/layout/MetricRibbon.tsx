import React from 'react';
import { Cpu, Database, Box, ShieldCheck } from 'lucide-react';

export interface MetricRibbonProps {
  workerCount: number;
  blackboardCount: number;
  sandboxCount: number;
  receiptCount: number;
  className?: string;
}

interface MetricTileConfig {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  hasStatusDot?: boolean;
}

export const MetricRibbon: React.FC<MetricRibbonProps> = ({
  workerCount,
  blackboardCount,
  sandboxCount,
  receiptCount,
  className = '',
}) => {
  const metrics: MetricTileConfig[] = [
    {
      id: 'workers',
      title: 'Active App Store Workers',
      subtitle: 'Registered Agents',
      value: workerCount,
      icon: Cpu,
      accentColor: 'text-olive',
      hasStatusDot: true,
    },
    {
      id: 'blackboard',
      title: 'Blackboard Synced Keys',
      subtitle: 'Shared Memory State',
      value: blackboardCount,
      icon: Database,
      accentColor: 'text-gold',
    },
    {
      id: 'sandboxes',
      title: 'Bubblewrap Sandbox Containers Executed',
      subtitle: 'Isolated Bwrap Instances',
      value: sandboxCount,
      icon: Box,
      accentColor: 'text-amber',
    },
    {
      id: 'receipts',
      title: 'Ed25519 Cryptographic Proofs Verified',
      subtitle: 'SHA-256 Signatures',
      value: receiptCount,
      icon: ShieldCheck,
      accentColor: 'text-green',
    },
  ];

  return (
    <section
      aria-label="Observability Ribbon"
      className={`w-full bg-surface border-b border-line ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.id}
                className="flex flex-col justify-between p-3.5 rounded-lg bg-paper border border-line shadow-2xs transition-all duration-150 hover:border-muted/50"
              >
                {/* Header: Title and Icon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {metric.hasStatusDot && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-green ring-2 ring-green/20 shrink-0"
                        title="Workers Online"
                        aria-label="Online"
                      />
                    )}
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium line-clamp-1">
                      {metric.title}
                    </span>
                  </div>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${metric.accentColor} opacity-90`}
                    aria-hidden="true"
                  />
                </div>

                {/* Body: Value and Subtitle */}
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl font-bold tracking-tight text-ink tabular-nums">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-muted tracking-tight truncate">
                    {metric.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MetricRibbon;
