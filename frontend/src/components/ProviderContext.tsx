'use client';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { providers } from '@/lib/mockData';

interface ProviderCtx {
  providerId: string;
  setProviderId: (id: string) => void;
  tokens: number;
  cost: number;
  budget: number;
}

const Ctx = createContext<ProviderCtx | null>(null);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [providerId, setProviderId] = useState('claude-3.5');
  // Backend integration: replace static token total with a live metering stream
  const tokens = 9661;
  const budget = 40000;
  const value = useMemo(() => {
    const p = providers.find((x) => x.id === providerId) ?? providers[0];
    return { providerId, setProviderId, tokens, budget, cost: (tokens / 1_000_000) * p.rate * 1000 };
  }, [providerId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProvider() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useProvider must be used within ProviderProvider');
  return c;
}