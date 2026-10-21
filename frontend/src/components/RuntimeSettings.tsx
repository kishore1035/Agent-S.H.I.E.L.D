import React, { useState } from 'react';
import { Settings, Cpu, Shield, Database, Terminal, Check, Copy } from 'lucide-react';

interface RuntimeSettingsProps {
  onTogglePreview?: () => void;
  mode?: 'live' | 'preview';
}

export const RuntimeSettings: React.FC<RuntimeSettingsProps> = ({ onTogglePreview, mode }) => {
  const [provider, setProvider] = useState<'claude' | 'ollama' | 'openai' | 'mock'>('ollama');
  const [copied, setCopied] = useState(false);

  const getCliCommand = (prov: string) => {
    switch (prov) {
      case 'ollama':
        return 'nexus daemon --provider ollama --model llama3.2 --port 8000';
      case 'claude':
        return 'nexus daemon --provider claude --model claude-3-5-sonnet-20241022 --port 8000';
      case 'openai':
        return 'nexus daemon --provider openai --model gpt-4o --port 8000';
      default:
        return 'nexus daemon --provider mock --port 8000';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCliCommand(provider));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-[#4f5d75]/60 shadow-2xl bg-[#222634]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#4f5d75]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ef8354]/15 text-[#ef8354] border border-[#ef8354]/30 shadow-[0_0_15px_rgba(239,131,84,0.2)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#ffffff]">
                Runtime Orchestration & LLM Discovery
              </h2>
              <p className="text-xs text-[#bfc0c0] mt-0.5">
                Configure backend LLM engine, sandbox parameters, and cryptographic signing keys.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="preview-mode"
            onClick={onTogglePreview}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#4f5d75] hover:bg-[#bfc0c0] text-[#ffffff] hover:text-[#222634] border border-[#4f5d75]/60 transition-colors"
          >
            {mode === 'preview' ? 'Exit preview mode' : 'Toggle preview mode'}
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label htmlFor="provider" className="text-xs font-mono uppercase tracking-wider text-[#bfc0c0] font-semibold block mb-2">
              Primary Autonomous LLM Engine
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="bg-[#1e222e] border border-[#4f5d75] rounded-xl px-4 py-2 text-xs font-semibold text-[#ffffff] focus:outline-none focus:border-[#ef8354] min-w-[220px]"
              >
                <option value="ollama">Ollama (Local) · llama3.2</option>
                <option value="claude">Anthropic Claude · 3.5 Sonnet</option>
                <option value="openai">OpenAI GPT-4o · High throughput</option>
                <option value="mock">Deterministic Mock · Instant sandbox</option>
              </select>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                {[
                  { id: 'ollama', label: 'Ollama', sub: 'Zero token cost' },
                  { id: 'claude', label: 'Claude', sub: '3.5 Sonnet' },
                  { id: 'openai', label: 'GPT-4o', sub: 'High throughput' },
                  { id: 'mock', label: 'Mock LLM', sub: 'Deterministic' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      provider === p.id
                        ? 'bg-[#ef8354]/15 border-[#ef8354] text-[#ffffff] shadow-[0_0_15px_rgba(239,131,84,0.2)]'
                        : 'bg-[#1e222e] border-[#4f5d75]/50 text-[#bfc0c0] hover:border-[#bfc0c0]/50'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#ffffff]">{p.label}</div>
                    <div className="text-[10px] text-[#bfc0c0]">{p.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick CLI command */}
          <div className="p-4 rounded-xl bg-[#1e222e] border border-[#4f5d75]/50">
            <div className="flex items-center justify-between text-xs text-[#bfc0c0] mb-2 font-mono">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-[#ef8354]" />
                CLI Startup Command
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-[#ef8354] hover:underline"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy command'}</span>
              </button>
            </div>
            <code id="provider-command" className="text-xs font-mono text-[#ffffff] block bg-[#222634] p-3 rounded-lg border border-[#4f5d75]/50 select-all">
              {getCliCommand(provider)}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
