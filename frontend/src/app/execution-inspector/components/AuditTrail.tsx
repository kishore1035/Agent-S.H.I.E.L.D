import React from 'react';
import Panel from '@/components/ui/Panel';
import Badge from '@/components/ui/Badge';

const events = [
  { id: 'aud-001', time: '01:04:30.912', actor: 'Ops Specialist', action: 'receipt.sign', detail: 'Ed25519 over sha256:3b9f1c2a…', tone: 'completed' as const },
  { id: 'aud-002', time: '01:04:30.910', actor: 'Planner', action: 'payload.digest', detail: 'Merged outputs of st-002, st-003, st-004', tone: 'routed' as const },
  { id: 'aud-003', time: '01:03:42.301', actor: 'Coding Specialist', action: 'heal.verified', detail: 'Rerun exit 0 · bwrap pid 48213', tone: 'healed' as const },
  { id: 'aud-004', time: '01:03:41.908', actor: 'Coding Specialist', action: 'heal.patch', detail: 'region → region_id, churned → churned_at', tone: 'healed' as const },
  { id: 'aud-005', time: '01:03:41.640', actor: 'Sandbox', action: 'exec.fail', detail: 'KeyError: region · exit 1', tone: 'failed' as const },
  { id: 'aud-006', time: '01:03:41.460', actor: 'Sandbox', action: 'exec.start', detail: 'bwrap --unshare-net --ro-bind /usr /usr …', tone: 'sandboxing' as const },
  { id: 'aud-007', time: '01:02:40.120', actor: 'Planner', action: 'plan.created', detail: '7 subtasks · 8 edges', tone: 'routed' as const },
];

export default function AuditTrail() {
  return (
    <Panel title="Audit trail" subtitle="Every action covered by the signed bundle">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {['Time (UTC)', 'Actor', 'Action', 'Detail'].map((h) => (
                <th key={`aud-col-${h}`} scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={`audit-${e.id}`} className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-muted/50">
                <td className="font-data tabular whitespace-nowrap px-4 py-2.5 text-xs">{e.time}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium">{e.actor}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={e.tone}>{e.action}</Badge>
                </td>
                <td className="font-data px-4 py-2.5 text-xs text-muted-foreground">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}