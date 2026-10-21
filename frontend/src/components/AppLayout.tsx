import React from 'react';
import Topbar from '@/components/Topbar';
import { ProviderProvider } from '@/components/ProviderContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderProvider>
      <div className="min-h-screen bg-background">
        <Topbar />
        <main className="mx-auto w-full max-w-screen-2xl px-4 pb-16 pt-8 md:px-6 xl:px-8 2xl:px-16">{children}</main>
      </div>
    </ProviderProvider>
  );
}