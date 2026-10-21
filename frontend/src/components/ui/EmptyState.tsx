import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-display text-lg font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}