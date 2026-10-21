import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default function InspectorHeader() {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
      </Link>
      <h1 className="font-display text-hero-xl mt-3 text-foreground">Execution inspector</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-data text-sm text-muted-foreground">run-8f21c4 / subtask-004</span>
        <Badge tone="healed">Healed</Badge>
        <Badge tone="routed">claude-3.5-sonnet</Badge>
      </div>
    </div>
  );
}