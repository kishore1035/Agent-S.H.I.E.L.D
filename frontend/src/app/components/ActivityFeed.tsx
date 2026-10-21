'use client';
import React, { useState } from 'react';
import { Inbox } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import EmptyState from '@/components/ui/EmptyState';
import { activity as seed } from '@/lib/mockData';

const dot: Record<string, string> = {
  routed: 'bg-routed',
  sandbox: 'bg-sandboxing',
  healed: 'bg-healed',
  completed: 'bg-completed',
  alert: 'bg-destructive',
};

export default function ActivityFeed() {
  const [items, setItems] = useState(seed);

  return (
    <Panel
      title="Activity"
      subtitle="Live event stream"
      action={
        <button
          type="button"
          onClick={() => setItems([])}
          className="rounded-sm px-2 py-1 text-sm text-accent transition-colors duration-150 hover:bg-accent/10"
        >
          Clear
        </button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="Ready when you are"
          description="Task activity from planners, workers and sandboxes will appear here."
          actionLabel="Restore sample events"
          onAction={() => setItems(seed)}
        />
      ) : (
        <ul className="scrollbar-thin max-h-[360px] overflow-y-auto">
          {items.map((a, i) => (
            <li
              key={`activity-${a.id}`}
              className={`fade-in flex gap-3 px-5 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[a.kind]}`} />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{a.text}</p>
                <p className="font-data mt-0.5 text-[11px] text-muted-foreground">{a.time} UTC</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}