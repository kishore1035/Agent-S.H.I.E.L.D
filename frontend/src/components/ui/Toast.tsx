'use client';
import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  tone?: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, tone = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="slide-in-right fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-2.5 rounded-md border border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg"
    >
      {tone === 'success' ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}