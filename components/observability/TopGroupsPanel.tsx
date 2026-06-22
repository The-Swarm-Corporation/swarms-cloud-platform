'use client';

import React from 'react';
import type { ObservabilityMetricsResponse } from '@/types/observability';

const GROUP_OPTIONS: { label: string; value: string }[] = [
  { label: 'None', value: 'none' },
  { label: 'Agent', value: 'agent' },
  { label: 'Model', value: 'model' },
  { label: 'Endpoint', value: 'endpoint' },
  { label: 'Swarm type', value: 'swarm_type' },
];

function fmtNumber(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function fmtPercent(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function fmtCurrency(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

export function TopGroupsPanel({ data }: { data: ObservabilityMetricsResponse }) {
  const { top_groups, group_by } = data;
  const label = GROUP_OPTIONS.find((g) => g.value === group_by)?.label ?? 'Group';

  if (group_by === 'none' || top_groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-medium text-foreground mb-3">Top drivers</div>
        <p className="text-xs text-muted-foreground">Select a group dimension to see top drivers.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-medium text-foreground mb-3">Top {label}s</div>
      <div className="space-y-2">
        {top_groups.map((g, i) => {
          const errorRate = g.requests > 0 ? (g.errors / g.requests) * 100 : 0;
          return (
            <div key={g.key} className="flex items-center gap-3 text-xs">
              <span className="w-4 text-muted-foreground tabular-nums text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-foreground font-medium" title={g.key}>
                  {g.key}
                </div>
                <div className="text-muted-foreground tabular-nums">
                  {fmtNumber(g.requests)} req · {fmtPercent(errorRate)} err
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="text-foreground font-medium">{fmtCurrency(g.total_cost)}</div>
                <div className="text-muted-foreground">{fmtNumber(g.total_tokens)} tok</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
