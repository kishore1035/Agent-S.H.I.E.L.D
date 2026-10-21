'use client';
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ${
        checked ? 'border-primary bg-primary' : 'border-input bg-muted'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-card shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}