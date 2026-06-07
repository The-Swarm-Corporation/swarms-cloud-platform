'use client';

/**
 * Escape a single CSV field per RFC 4180: wrap in double quotes if it contains
 * a quote, comma, or newline; double up internal quotes.
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeField).join(','),
    ...rows.map((r) => r.map(escapeField).join(',')),
  ];
  return lines.join('\r\n');
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][],
): void {
  if (typeof window === 'undefined') return;
  const csv = toCsv(headers, rows);
  // BOM so Excel detects UTF-8 cleanly.
  const blob = new Blob(['﻿', csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns a YYYY-MM-DD_HHMM timestamp in local time, suitable for filenames.
 */
export function csvTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + '_' + pad(date.getHours()) + pad(date.getMinutes());
}
