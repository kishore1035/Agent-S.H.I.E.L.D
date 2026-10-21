import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, LayoutGrid, Users, Terminal, Database, Shield, Settings, Play, Sparkles, X } from 'lucide-react';
import type { Page } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onRunPrompt: (task: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunPrompt,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const NAV_ITEMS: { page: Page; title: string; icon: React.FC<{ className?: string }> }[] = [
    { page: 'workspace', title: 'Agent Workspace (Overview)', icon: LayoutGrid },
    { page: 'agents', title: 'Agent Registry & Manifests', icon: Users },
    { page: 'executions', title: 'Execution Terminal & Telemetry', icon: Terminal },
    { page: 'blackboard', title: 'Shared Memory Blackboard', icon: Database },
    { page: 'trust', title: 'Trust & Cryptographic Receipts', icon: Shield },
    { page: 'runtime', title: 'Runtime & Provider Settings', icon: Settings },
  ];

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.page.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredNav.length > 0) {
        handleSelectNav(filteredNav[0].page);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="w-full max-w-xl rounded-2xl bg-[#222634] border border-[#ef8354]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="flex items-center px-4 py-3.5 border-b border-[#4f5d75]/50 gap-3">
          <Search className="w-5 h-5 text-[#ef8354]" />
          <input
            id="command-query"
            type="text"
            placeholder="Type a command or navigate to a view… (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            autoFocus
            className="w-full bg-transparent text-sm text-[#ffffff] placeholder:text-[#bfc0c0]/50 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#bfc0c0] hover:text-[#ffffff] hover:bg-[#4f5d75]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#bfc0c0] font-semibold px-3 py-1.5">
            Navigation
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleSelectNav(item.page)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#bfc0c0] hover:text-[#ffffff] hover:bg-[#4f5d75]/50 group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#ef8354] group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-[#ffffff]">{item.title}</span>
                </div>
                <span className="text-[10px] font-mono text-[#bfc0c0]/70 group-hover:text-[#ffffff]">
                  /{item.page}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-[#1e222e] border-t border-[#4f5d75]/50 flex items-center justify-between text-[11px] text-[#bfc0c0] font-mono">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-[#222634] border border-[#4f5d75] text-[#ffffff]">Enter</kbd></span>
          <span>Close with <kbd className="px-1.5 py-0.5 rounded bg-[#222634] border border-[#4f5d75] text-[#ffffff]">Esc</kbd></span>
        </div>
      </motion.div>
    </div>
  );
};
