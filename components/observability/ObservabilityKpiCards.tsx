'use client';

import React from 'react';
import { Activity, Timer, XCircle, DollarSign } from 'lucide-react';
import type { ObservabilityMetricsResponse } from '@/types/observability';

function fmtNumber(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function fmtLatency(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtCurrency(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

function fmtPercent(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function fmtDelta(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}% vs prev`;
}

function sparklineColorClass(delta: number | null): string {
  if (delta === null) return 'text-muted-foreground';
  return delta >= 0 ? 'text-success' : 'text-danger';
}

function MiniSparkline({ values, color = 'currentColor' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <div className="h-8" />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        points={pts.join(' ')}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  delta,
  sparklineValues,
  accent,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  delta: number | null;
  sparklineValues: number[];
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {title}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className={`text-xs font-medium tabular-nums ${sparklineColorClass(delta)}`}>
          {delta !== null ? (delta >= 0 ? '↑' : '↓') : ''} {fmtDelta(delta)}
        </div>
        <div className="flex-1 min-w-0">
          <MiniSparkline values={sparklineValues} color={accent} />
        </div>
      </div>
    </div>
  );
}

export function ObservabilityKpiCards({ data }: { data: ObservabilityMetricsResponse }) {
  const { totals, deltas, buckets } = data;
  const errorRate = totals.requests > 0 ? (totals.errors / totals.requests) * 100 : 0;

  const requestsSeries = buckets.map((b) => b.requests);
  const latencySeries = buckets.map((b) => b.latency_p50 ?? 0).filter((n) => n > 0);
  const errorsSeries = buckets.map((b) => b.errors);
  const costSeries = buckets.map((b) => b.total_cost ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <KpiCard
        title="Total Requests"
        value={fmtNumber(totals.requests)}
        subtitle={`Errors: ${fmtNumber(totals.errors)}`}
        delta={deltas.requests_delta}
        sparklineValues={requestsSeries}
        accent="#0070f3"
        icon={Activity}
      />
      <KpiCard
        title="Avg Latency"
        value={fmtLatency(totals.latency_p50)}
        subtitle={`p95 ${fmtLatency(totals.latency_p95)} · p99 ${fmtLatency(totals.latency_p99)}`}
        delta={deltas.latency_delta}
        sparklineValues={latencySeries.length > 1 ? latencySeries : [0, 0]}
        accent="#f59e0b"
        icon={Timer}
      />
      <KpiCard
        title="Error Rate"
        value={fmtPercent(errorRate)}
        subtitle={`${fmtNumber(totals.errors)} failed`}
        delta={deltas.errors_delta}
        sparklineValues={errorsSeries}
        accent="#e62929"
        icon={XCircle}
      />
      <KpiCard
        title="Total Cost"
        value={fmtCurrency(totals.total_cost)}
        subtitle={`${fmtNumber(totals.total_tokens)} tokens`}
        delta={deltas.cost_delta}
        sparklineValues={costSeries}
        accent="#009966"
        icon={DollarSign}
      />
    </div>
  );
}
