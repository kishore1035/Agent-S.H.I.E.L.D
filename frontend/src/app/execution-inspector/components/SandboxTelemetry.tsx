'use client';
import React, { useState } from 'react';
import { Check, Copy, ShieldCheck, ShieldAlert } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Badge from '@/components/ui/Badge';

const flags = [
  { flag: '--unshare-net', desc: 'No network namespace — outbound blocked', on: true },
  { flag: '--unshare-pid', desc: 'Isolated PID namespace', on: true },
  { flag: '--ro-bind /usr /usr', desc: 'System binaries read-only', on: true },
  { flag: '--ro-bind /sandbox/ro', desc: 'Input mounts read-only', on: true },
  { flag: '--tmpfs /tmp', desc: 'Ephemeral scratch space', on: true },
  { flag: '--die-with-parent', desc: 'Kill sandbox if worker exits', on: true },
  { flag: '--unshare-ipc', desc: 'Isolated IPC namespace', on: false },
];

const stats = [
  { label: 'PID', value: '48213' },
  { label: 'Exec time', value: '180ms' },
  { label: 'Peak RSS', value: '92 MB' },
  { label: 'Exit code', value: '0' },
];

export default function SandboxTelemetry() {
  const [copied, setCopied] = useState(false);

  const copyCmd = async () => {
    const cmd = flags?.filter((f) => f?.on)?.map((f) => f?.flag)?.join(' ');
    try {
      await navigator.clipboard?.writeText(`bwrap ${cmd} python3 /sandbox/work/main.py`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel
      title="Sandbox telemetry"
      subtitle="Bubblewrap container · attempt 2"
      action={
        <button
          type="button"
          onClick={copyCmd}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 hover:border-input active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy bwrap cmd'}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 p-5">
        {stats?.map((s) => (
          <div key={`stat-${s?.label}`} className="rounded-md border border-border bg-background p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s?.label}</p>
            <p className="tabular font-data mt-1 text-xl font-semibold">{s?.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-[13px] font-medium tracking-wide text-muted-foreground">Isolation flags</p>
          <Badge tone="completed">
            <ShieldCheck className="h-3 w-3" /> 6 of 7 active
          </Badge>
        </div>
        <ul>
          {flags?.map((f) => (
            <li
              key={`flag-${f?.flag}`}
              className="flex items-start gap-3 border-t border-border px-5 py-2.5 transition-colors duration-150 hover:bg-muted/50"
            >
              {f?.on ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-completed" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              )}
              <div className="min-w-0">
                <p className="font-data break-all text-xs font-medium">{f?.flag}</p>
                <p className="text-xs text-muted-foreground">{f?.desc}</p>
              </div>
              {!f?.on && <Badge tone="sandboxing" className="ml-auto">disabled</Badge>}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}