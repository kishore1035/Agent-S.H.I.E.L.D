'use client';
import React, { useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { bbKeys, BbKey } from '@/lib/mockData';
import EmptyState from '@/components/ui/EmptyState';
import KeyTree from '@/app/blackboard/components/KeyTree';
import KeyDetail from '@/app/blackboard/components/KeyDetail';
import InjectionForm from '@/app/blackboard/components/InjectionForm';

export default function BlackboardExplorer() {
  const [keys, setKeys] = useState<BbKey[]>(bbKeys);
  const [selectedPath, setSelectedPath] = useState<string>(bbKeys[4].path);
  const [query, setQuery] = useState('');
  const [flashPath, setFlashPath] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === '' ? keys : keys.filter((k) => k.path.toLowerCase().includes(q));
  }, [keys, query]);

  const selected = keys.find((k) => k.path === selectedPath) ?? keys[0];

  const inject = (path: string, value: string) => {
    // Backend integration: PUT /api/blackboard/:key with { value }, attributed to "Operator"
    setKeys((prev) => {
      const exists = prev.find((k) => k.path === path);
      const stamp = '01:04:33';
      if (exists) {
        const nextV = exists.revisions.length + 1;
        return prev.map((k) =>
          k.path === path
            ? { ...k, writer: 'Operator', revisions: [...k.revisions, { v: nextV, value, at: stamp, by: 'Operator' }] }
            : k,
        );
      }
      return [
        ...prev,
        {
          path,
          type: 'string',
          writer: 'Operator',
          readers: [],
          revisions: [{ v: 1, value, at: stamp, by: 'Operator' }],
        },
      ];
    });
    setSelectedPath(path);
    setFlashPath(path);
    setTimeout(() => setFlashPath(null), 1000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 2xl:grid-cols-12">
      <div className="xl:col-span-4">
        <div className="rounded-lg border border-border bg-card">
          <header className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl font-medium">Key tree</h2>
            <label className="relative mt-3 block">
              <span className="sr-only">Filter keys</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter keys…"
                className="font-data w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-xs outline-none transition-shadow duration-150 focus:border-accent focus:ring-2 focus:ring-ring/20"
              />
            </label>
          </header>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-5 w-5" />}
              title="No keys match"
              description="No blackboard key contains that text. Try a shorter path segment."
              actionLabel="Clear filter"
              onAction={() => setQuery('')}
            />
          ) : (
            <KeyTree keys={filtered} selectedPath={selected.path} onSelect={setSelectedPath} flashPath={flashPath} />
          )}
        </div>
      </div>

      <div className="space-y-6 xl:col-span-8">
        <KeyDetail bbKey={selected} flash={flashPath === selected.path} />
        <InjectionForm onInject={inject} />
      </div>
    </div>
  );
}