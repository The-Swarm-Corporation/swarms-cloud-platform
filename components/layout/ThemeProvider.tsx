'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/store/ui-store';
import { ResolvedTheme, Theme } from '@/types/ui';

const STORAGE_KEY = 'ui-store';

/**
 * Synchronous script injected into <head> by the root layout so the correct
 * theme class is applied before first paint, eliminates the dark→light flash.
 * Reads the persisted Zustand store directly.
 */
export const themeInitScript = `(() => {
  try {
    const raw = localStorage.getItem('${STORAGE_KEY}');
    let theme = 'system';
    if (raw) {
      const parsed = JSON.parse(raw);
      const t = parsed && parsed.state && parsed.state.theme;
      if (t === 'light' || t === 'dark' || t === 'system') {
        theme = t;
      } else if (t) {
        // Any unrecognised persisted value (legacy themes) falls back to dark.
        theme = 'dark';
      }
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    apply(resolve(theme));
  }, [theme]);

  // Track system preference changes when the user has chosen "system".
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(resolve('system'));
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  return <>{children}</>;
}
