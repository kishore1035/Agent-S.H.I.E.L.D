'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Play } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Toast from '@/components/ui/Toast';

interface TaskForm {
  prompt: string;
}

const examples = ['Analyze data', 'Research a topic', 'Refactor a module'];

export default function TaskComposer() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskForm>({ defaultValues: { prompt: '' } });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onSubmit = async (data: TaskForm) => {
    setSubmitting(true);
    // Backend integration: POST /api/runs with { prompt } and stream status via SSE
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setToast(`Run queued — planner decomposing "${data.prompt.slice(0, 40)}${data.prompt.length > 40 ? '…' : ''}"`);
    reset();
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const promptReg = register('prompt', {
    required: 'Describe the task before running it',
    minLength: { value: 12, message: 'Add a little more detail — at least 12 characters' },
  });

  return (
    <Panel title="New task" subtitle="Planner will split this into routed subtasks">
      <form onSubmit={handleSubmit(onSubmit)} className="p-5">
        <label htmlFor="prompt" className="mb-1.5 block text-[13px] font-medium tracking-wide text-muted-foreground">
          Task description
        </label>
        <textarea
          id="prompt"
          rows={4}
          {...promptReg}
          onKeyDown={onKey}
          placeholder="Describe what you want your agents to do…"
          className="font-data w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow duration-150 placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/20"
        />
        {errors.prompt && <p className="mt-1.5 text-xs text-destructive">{errors.prompt.message}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-32 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {submitting ? 'Queuing' : 'Run task'}
          </button>
          <span className="font-data text-xs text-muted-foreground">Ctrl + Enter</span>
          <div className="ml-auto flex flex-wrap items-center gap-x-1 text-sm">
            <span className="mr-1 text-xs text-muted-foreground">Examples:</span>
            {examples.map((ex) => (
              <button
                key={`example-${ex}`}
                type="button"
                onClick={() => setValue('prompt', `${ex} — sales_q3.csv by region, flag outliers above 1.5σ`)}
                className="rounded-sm px-2 py-1 text-accent transition-colors duration-150 hover:bg-accent/10"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </form>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </Panel>
  );
}