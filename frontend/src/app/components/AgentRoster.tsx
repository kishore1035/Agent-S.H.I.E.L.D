import React from 'react';
import Panel from '@/components/ui/Panel';
import Badge from '@/components/ui/Badge';
import { agents } from '@/lib/mockData';

const loadColor = (load: number) => (load > 85 ? 'bg-destructive' : load > 60 ? 'bg-warning' : 'bg-completed');

export default function AgentRoster() {
  return (
    <Panel title="Registered agents" subtitle="4 workers · 1 degraded">
      <ul>
        {agents.map((a, i) => (
          <li
            key={`agent-${a.id}`}
            className={`px-5 py-3.5 transition-colors duration-150 hover:bg-muted/50 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-lg font-medium leading-tight">{a.name}</p>
              <p className="font-data text-[11px] text-muted-foreground">{a.skills.join(' · ')}</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${loadColor(a.load)} transition-all duration-500`} style={{ width: `${a.load}%` }} />
              </div>
              <span className="tabular font-data w-9 text-right text-[11px]">{a.load}%</span>
              <Badge tone={a.status === 'degraded' ? 'failed' : a.status === 'busy' ? 'routed' : 'pending'}>{a.status}</Badge>
            </div>
            <p className="font-data mt-1.5 text-[11px] text-muted-foreground">{a.model}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}