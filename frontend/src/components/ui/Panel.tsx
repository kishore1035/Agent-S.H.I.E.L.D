import React from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Panel({ title, subtitle, action, children, className = '', bodyClassName = '' }: PanelProps) {
  return (
    <section className={`rounded-lg border border-border bg-card text-card-foreground shadow-card ${className}`}>
      <header className="flex items-start justify-between gap-3 px-6 pb-3 pt-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}