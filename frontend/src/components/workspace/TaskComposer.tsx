import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Sparkles, XCircle, CornerDownLeft } from 'lucide-react';

export interface PresetChip {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

export const PRESET_CHIPS: PresetChip[] = [
  {
    id: 'self-heal',
    label: '🛡️ Self-Heal Demo',
    prompt:
      'Run Self-Healing Security Guard demo: inject faulty code, catch error, and test iterative repair',
    description: 'Bubblewrap sandbox fault injection and iterative auto-healing',
  },
  {
    id: 'multi-agent',
    label: '⚡ Multi-Agent Pipeline',
    prompt:
      'Analyze market trends, clean sales dataset, and generate python forecast script',
    description: 'Supervisor routing, blackboard sync, and code execution',
  },
  {
    id: 'ops-verify',
    label: '🐳 Ops & Verification',
    prompt:
      'Research kubernetes deployment manifests and write automated verification script',
    description: 'Infrastructure research and cryptographic receipt signing',
  },
];

export interface TaskComposerProps {
  onDispatch: (prompt: string) => void;
  isExecuting: boolean;
  initialPrompt?: string;
  className?: string;
}

export const TaskComposer: React.FC<TaskComposerProps> = ({
  onDispatch,
  isExecuting,
  initialPrompt = '',
  className = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initialPrompt if provided externally
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isExecuting) return;
    onDispatch(cleanPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectPreset = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const len = presetPrompt.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  };

  const handleClear = () => {
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-xs overflow-hidden transition-all duration-200 ${className}`}
      data-testid="task-composer"
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-olive animate-pulse" />
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Mission Composer
          </h2>
          <span className="hidden sm:inline-block text-xs font-mono text-muted">
            / Autonomous Task Dispatch
          </span>
        </div>

        {/* Keyboard shortcut hint badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-paper px-2.5 py-1 rounded border border-line">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Run:
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink font-semibold">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink font-semibold">
            Enter
          </kbd>
        </div>
      </div>

      {/* Textarea Form */}
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Type your high-level goal in natural language or select a benchmark preset below... (Ctrl+Enter to dispatch)"
            rows={4}
            className="w-full p-3.5 bg-paper/50 border border-line rounded-md font-mono text-xs sm:text-sm text-ink placeholder:text-muted/70 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-olive focus:border-olive transition-colors disabled:opacity-60 disabled:cursor-wait"
            aria-label="Mission prompt input"
          />
          {prompt.length > 0 && !isExecuting && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2.5 right-2.5 p-1 text-muted hover:text-ink rounded transition-colors"
              title="Clear input"
              aria-label="Clear prompt"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Benchmark Preset Chips */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Benchmark Presets:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_CHIPS.map((chip) => {
              const isSelected = prompt === chip.prompt;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSelectPreset(chip.prompt)}
                  disabled={isExecuting}
                  title={chip.description}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all duration-150 cursor-pointer disabled:cursor-wait disabled:opacity-50 border ${
                    isSelected
                      ? 'bg-olive/15 border-olive text-ink font-medium shadow-xs ring-1 ring-olive/40'
                      : 'bg-paper hover:bg-surface border-line text-muted hover:text-ink'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex items-center gap-3 text-xs font-mono text-muted">
            <span className="tabular-nums">
              {prompt.length} {prompt.length === 1 ? 'char' : 'chars'}
            </span>
            {isExecuting && (
              <span className="flex items-center gap-1.5 text-amber font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber inline-block" />
                Orchestrating agent pipeline...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {prompt.trim().length > 0 && !isExecuting && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs font-mono text-muted hover:text-ink transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}

            {/* Primary Dispatch Button */}
            <button
              type="submit"
              disabled={isExecuting || !prompt.trim()}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-sans text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer shadow-xs ${
                isExecuting
                  ? 'bg-ink/80 text-paper cursor-wait opacity-80'
                  : !prompt.trim()
                    ? 'bg-line text-muted cursor-not-allowed opacity-60'
                    : 'bg-ink text-paper hover:bg-ink/90 active:scale-[0.99] hover:shadow'
              }`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-paper" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch Task</span>
                  <CornerDownLeft className="w-3 h-3 opacity-60 ml-0.5 hidden sm:inline" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TaskComposer;
