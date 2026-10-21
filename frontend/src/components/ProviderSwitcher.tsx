'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Cpu, Check } from 'lucide-react';
import { providers } from '@/lib/mockData';
import { useProvider } from '@/components/ProviderContext';

export default function ProviderSwitcher() {
  const { providerId, setProviderId } = useProvider();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = providers.find((p) => p.id === providerId) ?? providers[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-all duration-150 hover:border-input active:scale-95"
      >
        <Cpu className="h-3.5 w-3.5 text-accent" />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Model</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="modal-in absolute right-0 z-50 mt-1.5 w-64 overflow-hidden rounded-md border border-border bg-card shadow-lg"
        >
          {providers.map((p) => (
            <li key={`provider-${p.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={p.id === providerId}
                onClick={() => {
                  setProviderId(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{p.label}</span>
                  <span className="font-data text-[11px] text-muted-foreground">
                    {p.kind} · {p.rate === 0 ? 'free' : `$${p.rate.toFixed(2)}/1M in`}
                  </span>
                </span>
                {p.id === providerId && <Check className="h-4 w-4 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}