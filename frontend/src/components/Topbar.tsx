'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import ProviderSwitcher from '@/components/ProviderSwitcher';
import CostMeter from '@/components/CostMeter';

const navItems = [
  { href: '/', label: 'Workspace' },
  { href: '/execution-inspector', label: 'Inspector' },
  { href: '/blackboard', label: 'Blackboard' },
];

export default function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 md:px-6 xl:px-8 2xl:px-16">
        <Link href="/" className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <span className="text-xl font-extrabold tracking-tight">Nexus</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 rounded-full bg-muted p-1 md:flex" aria-label="Primary">
          {navItems?.map((item) => {
            const active = item?.href === '/' ? pathname === '/' : pathname?.startsWith(item?.href);
            return (
              <Link
                key={`nav-${item?.label}`}
                href={item?.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-card text-accent shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item?.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <CostMeter />
          <ProviderSwitcher />
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((o) => !o)}
            className="rounded-full border border-border p-2 transition-all duration-150 active:scale-95 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="fade-in border-t border-border bg-card p-2 md:hidden" aria-label="Mobile">
          {navItems?.map((item) => {
            const active = item?.href === '/' ? pathname === '/' : pathname?.startsWith(item?.href);
            return (
              <Link
                key={`mnav-${item?.label}`}
                href={item?.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-4 py-3 text-sm ${active ? 'bg-accent/10 font-semibold text-accent' : 'text-foreground'}`}
              >
                {item?.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}