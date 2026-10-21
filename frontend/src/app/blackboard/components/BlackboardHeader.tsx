import React from 'react';
import { Database } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default function BlackboardHeader() {
  return (
    <div>
      <h1 className="font-display text-hero-xl font-medium text-foreground">Blackboard</h1>
      <p className="mt-2 font-display text-xl text-muted-foreground">
        Shared memory every agent reads from and writes to.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <Database className="h-3 w-3" /> 9 keys
        </Badge>
        <Badge tone="neutral">22 revisions</Badge>
        <Badge tone="sandboxing">1 pending write</Badge>
        <span className="font-data text-xs text-muted-foreground">last mutation 01:04:11 UTC · run-8f21c4</span>
      </div>
    </div>
  );
}