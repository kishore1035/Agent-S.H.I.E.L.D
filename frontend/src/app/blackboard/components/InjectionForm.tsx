'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Syringe } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Toast from '@/components/ui/Toast';

interface InjectionValues {
  path: string;
  value: string;
}

interface InjectionFormProps {
  onInject: (path: string, value: string) => void;
}

export default function InjectionForm({ onInject }: InjectionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<InjectionValues>({
    defaultValues: { path: 'run/8f21c4/', value: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const submit = async (data: InjectionValues) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    onInject(data.path.trim(), data.value.trim());
    setSubmitting(false);
    setToast(`Injected ${data.path.trim()} — attributed to Operator`);
    reset({ path: 'run/8f21c4/', value: '' });
  };

  return (
    <Panel title="Inject state" subtitle="Write a key manually to test how agents react to injected memory">
      <form onSubmit={handleSubmit(submit)} className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="inj-path" className="mb-1.5 block text-[13px] font-medium tracking-wide text-muted-foreground">
              Key path
            </label>
            <input
              id="inj-path"
              {...register('path', {
                required: 'A key path is required',
                pattern: {
                  value: /^[a-z0-9_.-]+(\/[a-zA-Z0-9_.-]+)+$/,
                  message: 'Use a slash path like run/8f21c4/override.region',
                },
              })}
              className="font-data w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow duration-150 focus:border-accent focus:ring-2 focus:ring-ring/20"
            />
            {errors.path && <p className="mt-1.5 text-xs text-destructive">{errors.path.message}</p>}
          </div>
          <div>
            <label htmlFor="inj-value" className="mb-1.5 block text-[13px] font-medium tracking-wide text-muted-foreground">
              Value
            </label>
            <input
              id="inj-value"
              {...register('value', {
                required: 'Provide a value to write',
                maxLength: { value: 400, message: 'Keep the value under 400 characters' },
              })}
              placeholder='e.g. ["R-14","R-99"]'
              className="font-data w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow duration-150 placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/20"
            />
            {errors.value && <p className="mt-1.5 text-xs text-destructive">{errors.value.message}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Writes create a new revision and are attributed to <span className="font-data font-semibold">Operator</span> in the access log. Agents
          that read this key will see the injected value on their next step.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-40 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Syringe className="h-4 w-4" />}
            {submitting ? 'Writing' : 'Inject key'}
          </button>
          {isDirty && !submitting && <span className="text-xs text-warning">Unsaved draft</span>}
        </div>
      </form>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </Panel>
  );
}