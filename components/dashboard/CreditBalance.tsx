'use client';

import React from 'react';
import Link from 'next/link';
import { useCredits } from '@/lib/hooks/useCredits';
import { Wallet } from 'lucide-react';

function formatCredits(value: number): string {
  // Compact: 12,345 → 12.3K, 1,234,567 → 1.2M
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

export function CreditBalance() {
  const { credits, isLoading, error } = useCredits();

  if (error || (!credits && !isLoading)) return null;

  const total = credits?.total_credits ?? 0;
  const titleParts = credits
    ? [
        `Total: $${credits.total_credits.toFixed(2)}`,
        `Paid: $${credits.credit.toFixed(2)}`,
        `Free: $${credits.free_credit.toFixed(2)}`,
        `Referral: $${credits.referral_credits.toFixed(2)}`,
        '',
        'Click to open Settings',
      ].join('\n')
    : 'Loading credits… Click to open Settings';

  const isLow = credits ? credits.total_credits < 1 : false;

  return (
    <Link
      href="/settings"
      className="hidden md:inline-flex items-center gap-1.5 h-7 px-2 rounded-sm border border-border bg-card text-xs hover:bg-muted hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      title={titleParts}
      aria-label="Open settings"
    >
      <Wallet className={`w-3.5 h-3.5 ${isLow ? 'text-warning' : 'text-muted-foreground'}`} />
      <span className="text-muted-foreground">Credits</span>
      {credits ? (
        <span
          className={`font-medium tabular-nums ${isLow ? 'text-warning' : 'text-foreground'}`}
        >
          {formatCredits(total)}
        </span>
      ) : (
        <span className="text-muted-foreground tabular-nums"> - </span>
      )}
    </Link>
  );
}
