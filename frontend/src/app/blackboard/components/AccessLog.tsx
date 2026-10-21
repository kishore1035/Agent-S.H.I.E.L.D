import React from 'react';
import Panel from '@/components/ui/Panel';
import Badge from '@/components/ui/Badge';
import { accessLog } from '@/lib/mockData';

export default function AccessLog() {
  return (
    <Panel title="Access log" subtitle="Reads and writes across all agents, newest first">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {['Time (UTC)', 'Actor', 'Operation', 'Key', 'Note']?.map((h) => (
                <th key={`log-col-${h}`} scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accessLog?.map((l) => (
              <tr key={`access-${l?.id}`} className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-muted/50">
                <td className="font-data tabular whitespace-nowrap px-4 py-2.5 text-xs">{l?.time}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium">{l?.actor}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={l?.op === 'WRITE' ? 'healed' : 'routed'}>{l?.op}</Badge>
                </td>
                <td className="font-data px-4 py-2.5 text-xs">{l?.key}</td>
                <td className="font-data px-4 py-2.5 text-xs text-muted-foreground">{l?.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}