import React from 'react';

type Tone = 'neutral' | 'routed' | 'sandboxing' | 'healed' | 'completed' | 'pending' | 'failed' | 'accent';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground border-transparent',
  routed: 'bg-routed/10 text-routed border-transparent',
  sandboxing: 'bg-sandboxing/10 text-sandboxing border-transparent',
  healed: 'bg-healed/10 text-healed border-transparent',
  completed: 'bg-completed/10 text-completed border-transparent',
  pending: 'bg-muted text-muted-foreground border-transparent',
  failed: 'bg-destructive/10 text-destructive border-transparent',
  accent: 'bg-accent/10 text-accent border-transparent',
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export default function Badge({ tone = 'neutral', children, mono = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        mono ? 'font-data' : ''
      } ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'COMPLETED': case'verified':
      return 'completed';
    case 'HEALED':
      return 'healed';
    case 'SANDBOXING':
      return 'sandboxing';
    case 'ROUTED':
      return 'routed';
    case 'FAILED': case'failed':
      return 'failed';
    default:
      return 'pending';
  }
}