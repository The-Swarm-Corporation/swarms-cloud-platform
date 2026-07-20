'use client';

import React from 'react';
import { useUIStore } from '@/lib/store/ui-store';
import { Theme } from '@/types/ui';
import { Monitor, Moon, Sun } from 'lucide-react';

interface ThemeSwitcherProps {
  compact?: boolean;
}

const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  if (compact) {
    // Cycles through Light → Dark → System on click.
    const currentIndex = options.findIndex((o) => o.value === theme);
    const safeIndex = currentIndex !== -1 ? currentIndex : 2;
    const current = options[safeIndex];
    const next = options[(safeIndex + 1) % options.length];
    const Icon = current.icon;
    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title={`Theme: ${current.label}, click for ${next.label}`}
        aria-label={`Switch theme (currently ${current.label})`}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-subtle p-0.5"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium transition-colors ${
              active
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={opt.label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
