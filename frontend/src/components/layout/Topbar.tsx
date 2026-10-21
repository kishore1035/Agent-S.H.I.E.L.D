import React from 'react';
import { Terminal, Cpu, Database } from 'lucide-react';
import type { ActiveTab } from '../../types/nexus';

export interface TopbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isConnected: boolean;
  latencyMs: number | null;
  className?: string;
}

interface NavTabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_TABS: NavTabItem[] = [
  { id: 'workspace', label: 'Workspace', icon: Terminal },
  { id: 'workers', label: 'Workers', icon: Cpu },
  { id: 'blackboard', label: 'Blackboard', icon: Database },
];

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onTabChange,
  isConnected,
  latencyMs,
  className = '',
}) => {
  return (
    <header
      className={`w-full bg-surface border-b border-line shadow-xs ${className}`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Mark with Editorial Serif + Subtitle */}
          <div className="flex items-baseline gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-ink">
                Nexus
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-line bg-paper text-gold font-semibold tracking-wide">
                v0.1
              </span>
            </div>
            <div className="h-3.5 w-px bg-line hidden sm:block" />
            <span className="text-xs font-mono text-muted uppercase tracking-wider hidden sm:inline-block">
              Autonomous Agent Runtime
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav
            className="flex items-center gap-1 sm:gap-2 p-1 bg-paper/80 border border-line rounded-lg"
            aria-label="Primary Navigation"
            role="tablist"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wide rounded-md transition-all duration-150 relative cursor-pointer ${
                    isActive
                      ? 'bg-surface text-ink font-semibold border border-line shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-surface/50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-olive' : 'text-muted'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-olive rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Observability Telemetry & Repo Link */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live WebSocket Status Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono transition-colors ${
                isConnected
                  ? 'bg-paper border-green/30 text-ink'
                  : 'bg-paper border-amber/30 text-ink'
              }`}
              title={
                isConnected
                  ? 'Live WebSocket telemetry active'
                  : 'Reconnecting WebSocket stream'
              }
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber" />
                  </>
                )}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase">
                {isConnected ? 'LIVE' : 'SYNCING'}
              </span>
              <span className="text-muted text-[10px]">|</span>
              <span className="text-[11px] text-muted tabular-nums">
                {latencyMs !== null
                  ? `${latencyMs}ms`
                  : isConnected
                    ? '<1ms'
                    : '--'}
              </span>
            </div>

            {/* GitHub Repo Link Badge */}
            <a
              href="https://github.com/vinay3254/nexus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-muted hover:text-ink bg-paper border border-line rounded-md transition-colors cursor-pointer"
              title="Nexus GitHub Repository"
              aria-label="Nexus GitHub Repository"
            >
              <svg
                className="w-3.5 h-3.5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span className="hidden sm:inline">Repo</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
