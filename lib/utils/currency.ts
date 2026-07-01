'use client';

/**
 * Format a dollar amount for the spend column.
 *
 * - $0.0034  for sub-cent values
 * - $0.42    for sub-dollar
 * - $48.20   for the rest
 * - $1,204.50 with thousands separators when >= $1,000
 */
export function formatSpend(n: number): string {
  if (n === 0) return '$0.00';
  if (n < 0.01) {
    // Show enough decimals to represent the value (up to 6)
    let decimals = 4;
    let scaled = n * 10 ** decimals;
    while (scaled < 1 && decimals < 6) {
      decimals++;
      scaled = n * 10 ** decimals;
    }
    return `$${n.toFixed(decimals)}`;
  }
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
