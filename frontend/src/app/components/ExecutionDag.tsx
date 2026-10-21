'use client';
import React, { useState } from 'react';
import { Network } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Badge, { statusTone } from '@/components/ui/Badge';
import { dagNodes, DagNode, SubtaskStatus } from '@/lib/mockData';
import NodeDrawer from '@/app/components/NodeDrawer';

const NODE_W = 150;
const NODE_H = 54;

const statusRing: Record<SubtaskStatus, string> = {
  PENDING: 'border-input bg-card',
  ROUTED: 'border-routed bg-routed/10 pulse-ring',
  SANDBOXING: 'border-sandboxing bg-sandboxing/10',
  HEALED: 'border-healed bg-healed/10',
  COMPLETED: 'border-completed bg-completed/10',
  FAILED: 'border-destructive bg-destructive/10',
};

const legend: SubtaskStatus[] = ['PENDING', 'ROUTED', 'SANDBOXING', 'HEALED', 'COMPLETED'];

export default function ExecutionDag() {
  const [selected, setSelected] = useState<DagNode | null>(null);
  const byId = Object.fromEntries(dagNodes.map((n) => [n.id, n]));
  const edges = dagNodes.flatMap((n) => n.deps.map((d) => ({ from: byId[d], to: n })));

  return (
    <Panel
      title="Execution graph"
      subtitle="run-8f21c4 · 7 subtasks · click a node to inspect"
      action={
        <div className="hidden flex-wrap items-center gap-1.5 md:flex">
          {legend.map((s) => (
            <Badge key={`legend-${s}`} tone={statusTone(s)}>
              {s}
            </Badge>
          ))}
        </div>
      }
    >
      <div className="scrollbar-thin overflow-x-auto">
        <div className="grid-paper relative h-[320px] min-w-[1040px]">
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {edges.map(({ from, to }) => {
              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const live = to.status === 'ROUTED' || to.status === 'SANDBOXING' || to.status === 'HEALED';
              const done = from.status === 'COMPLETED' || from.status === 'HEALED';
              return (
                <path
                  key={`edge-${from.id}-${to.id}`}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={live ? 'var(--routed)' : done ? 'var(--completed)' : 'var(--input)'}
                  strokeWidth={live ? 2 : 1.5}
                  className={live ? 'dag-edge' : done ? '' : 'dag-edge-idle'}
                />
              );
            })}
          </svg>

          {dagNodes.map((n) => (
            <button
              key={`node-${n.id}`}
              type="button"
              onClick={() => setSelected(n)}
              className={`absolute flex flex-col items-start justify-center rounded-md border-2 px-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${statusRing[n.status]} ${
                selected?.id === n.id ? 'ring-2 ring-accent' : ''
              }`}
              style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
            >
              <span className="font-data text-[10px] uppercase text-muted-foreground">{n.id.replace('subtask-', 'st-')}</span>
              <span className="w-full truncate text-xs font-semibold">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5" /> 7 nodes · 8 edges
        </span>
        <span className="font-data">critical path: 001 → 003 → 004 → 005 → 007</span>
        <span className="font-data ml-auto">elapsed 1.36s</span>
      </div>

      <NodeDrawer node={selected} onClose={() => setSelected(null)} />
    </Panel>
  );
}