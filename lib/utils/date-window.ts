'use client';

export type DatePreset = 'all' | '24h' | '7d' | '30d' | 'custom';

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7d' },
  { id: '30d', label: 'Last 30d' },
  { id: 'custom', label: 'Custom' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateInput(value: string, endOfDay = false): number | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const date = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  return date.getTime();
}

export function presetRange(
  preset: DatePreset,
): { from: number; to: number } | null {
  const now = Date.now();
  switch (preset) {
    case '24h':
      return { from: now - DAY_MS, to: Number.POSITIVE_INFINITY };
    case '7d':
      return { from: now - 7 * DAY_MS, to: Number.POSITIVE_INFINITY };
    case '30d':
      return { from: now - 30 * DAY_MS, to: Number.POSITIVE_INFINITY };
    default:
      return null;
  }
}

export function getActiveRange(
  datePreset: DatePreset,
  customFrom: string,
  customTo: string,
): { from: number; to: number } | null {
  if (datePreset === 'custom') {
    const from = parseDateInput(customFrom, false);
    const to = parseDateInput(customTo, true);
    if (from === null && to === null) return null;
    return {
      from: from ?? Number.NEGATIVE_INFINITY,
      to: to ?? Number.POSITIVE_INFINITY,
    };
  }
  return presetRange(datePreset);
}
