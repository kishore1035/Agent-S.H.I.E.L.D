'use client';
import React, { useMemo, useState } from 'react';
import { ChevronRight, FileText, Folder } from 'lucide-react';
import { BbKey } from '@/lib/mockData';
import Badge from '@/components/ui/Badge';

interface KeyTreeProps {
  keys: BbKey[];
  selectedPath: string;
  onSelect: (path: string) => void;
  flashPath: string | null;
}

interface Group {
  prefix: string;
  items: BbKey[];
}

export default function KeyTree({ keys, selectedPath, onSelect, flashPath }: KeyTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, BbKey[]>();
    keys.forEach((k) => {
      const parts = k.path.split('/');
      const prefix = parts.slice(0, -1).join('/');
      map.set(prefix, [...(map.get(prefix) ?? []), k]);
    });
    return Array.from(map.entries()).map(([prefix, items]) => ({ prefix, items }));
  }, [keys]);

  return (
    <ul className="scrollbar-thin max-h-[640px] overflow-y-auto py-2">
      {groups.map((g) => {
        const isCollapsed = collapsed[g.prefix];
        return (
          <li key={`group-${g.prefix}`}>
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [g.prefix]: !c[g.prefix] }))}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-1.5 px-4 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors duration-150 hover:bg-muted/50"
            >
              <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
              <Folder className="h-3.5 w-3.5" />
              <span className="font-data truncate">{g.prefix}/</span>
              <span className="tabular ml-auto">{g.items.length}</span>
            </button>
            {!isCollapsed && (
              <ul>
                {g.items.map((k) => {
                  const leaf = k.path.split('/').pop() ?? k.path;
                  const active = k.path === selectedPath;
                  const latest = k.revisions[k.revisions.length - 1];
                  return (
                    <li key={`key-${k.path}`}>
                      <button
                        type="button"
                        onClick={() => onSelect(k.path)}
                        className={`group flex w-full items-center gap-2 border-l-2 py-2 pl-9 pr-4 text-left transition-colors duration-150 ${
                          active ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-muted/50'
                        } ${flashPath === k.path ? 'value-flash' : ''}`}
                      >
                        <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`font-data block truncate text-xs ${active ? 'font-semibold text-accent' : ''}`}>{leaf}</span>
                          <span className="font-data block truncate text-[10px] text-muted-foreground">
                            {k.writer} · {latest.at}
                          </span>
                        </span>
                        <Badge tone="neutral">v{k.revisions.length}</Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}