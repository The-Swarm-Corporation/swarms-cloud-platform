'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useSwarmLogs, type SwarmLogEntry } from '@/lib/hooks/useSwarmLogs';
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  Gauge,
  Loader2,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react';

type Granularity = '15m' | '1h' | '6h' | '1d';

const GRANULARITY_OPTIONS: { value: Granularity; label: string; ms: number }[] = [
  { value: '15m', label: '15 Minutes', ms: 15 * 60 * 1000 },
  { value: '1h', label: '1 Hour', ms: 60 * 60 * 1000 },
  { value: '6h', label: '6 Hours', ms: 6 * 60 * 60 * 1000 },
  { value: '1d', label: '1 Day', ms: 24 * 60 * 60 * 1000 },
];

const RANGE_MS = 24 * 60 * 60 * 1000;

export default function ObservabilityPage() {
  const { logs, isLoading, error, refetch } = useSwarmLogs();
  const [granularity, setGranularity] = useState<Granularity>('15m');
  const [now] = useState(() => Date.now());

  const rangeStart = now - RANGE_MS;
  const rangeEnd = now;

  const logsInRange = useMemo(() => {
    return logs.filter((log) => {
      if (!log.timestamp) return false;
      const t = new Date(log.timestamp).getTime();
      return Number.isFinite(t) && t >= rangeStart && t <= rangeEnd;
    });
  }, [logs, rangeStart, rangeEnd]);

  const metrics = useMemo(() => deriveMetrics(logsInRange), [logsInRange]);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Telemetry</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Observability
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Monitor your API request performance, latency, and error rates.
              Sourced from{' '}
              <code className="text-foreground">/v1/swarm/logs</code>.
            </p>
          </div>

          <ControlsBar
            granularity={granularity}
            onGranularityChange={setGranularity}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onRefresh={refetch}
            isLoading={isLoading}
          />

          {error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center mb-6">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : isLoading && logs.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center mb-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading telemetry…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Total Requests"
                icon={Activity}
                value={metrics.totalRequests.value}
                unit={metrics.totalRequests.unit}
                series={metrics.totalRequests.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <MetricCard
                title="E2E Latency"
                icon={Gauge}
                value={metrics.e2eLatency.value}
                unit={metrics.e2eLatency.unit}
                series={metrics.e2eLatency.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <MetricCard
                title="TTFT"
                icon={Zap}
                value={metrics.ttft.value}
                unit={metrics.ttft.unit}
                series={metrics.ttft.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <MetricCard
                title="Mean ITL"
                icon={Activity}
                value={metrics.meanItl.value}
                unit={metrics.meanItl.unit}
                series={metrics.meanItl.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <MetricCard
                title="Avg Request Size"
                icon={Activity}
                value={metrics.avgRequestSize.value}
                unit={metrics.avgRequestSize.unit}
                series={metrics.avgRequestSize.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <MetricCard
                title="Error Rate"
                icon={AlertTriangle}
                value={metrics.errorRate.value}
                unit={metrics.errorRate.unit}
                series={metrics.errorRate.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
                accent={
                  metrics.errorRate.value !== null &&
                  metrics.errorRate.value > 0
                    ? 'danger'
                    : 'default'
                }
              />
              <MetricCard
                title="Rate Limit Events"
                icon={AlertTriangle}
                value={metrics.rateLimitEvents.value}
                unit={metrics.rateLimitEvents.unit}
                series={metrics.rateLimitEvents.series}
                emptyMessage="No data in selected range"
                granularity={granularity}
              />
              <ErrorListCard
                title="Top Error Messages"
                items={metrics.topErrors}
                emptyMessage="No errors in the selected time range"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ControlsBar({
  granularity,
  onGranularityChange,
  rangeStart,
  rangeEnd,
  onRefresh,
  isLoading,
}: {
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  rangeStart: number;
  rangeEnd: number;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-border">
      <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card text-sm">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Filters</span>
        <span className="text-foreground">None</span>
      </div>

      <label className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card text-sm">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Granularity</span>
        <span className="relative inline-flex items-center">
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value as Granularity)}
            className="appearance-none bg-transparent pr-5 text-foreground text-sm focus:outline-none cursor-pointer"
            aria-label="Granularity"
          >
            {GRANULARITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-0 pointer-events-none" />
        </span>
      </label>

      <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card text-sm text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-foreground tabular-nums">
          {formatRange(rangeStart, rangeEnd)}
        </span>
      </div>

      <div className="ml-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh"
          title="Refresh"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon: Icon,
  value,
  unit,
  series,
  emptyMessage,
  granularity,
  accent = 'default',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number | null;
  unit: string;
  series: number[];
  emptyMessage: string;
  granularity: Granularity;
  accent?: 'default' | 'danger';
}) {
  const hasData = value !== null && Number.isFinite(value);
  const valueColor =
    accent === 'danger' && hasData ? 'text-danger' : 'text-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 min-h-[160px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-semibold tabular-nums ${valueColor}`}>
              {formatNumber(value!)}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground">{unit}</span>
            )}
          </div>
          <div className="flex-1 min-h-[40px]">
            <Sparkline values={series} accent={accent} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function ErrorListCard({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: { message: string; count: number }[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 min-h-[160px] md:col-span-2 lg:col-span-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-2 flex-1">
          {items.map((item, i) => (
            <li
              key={`${i}-${item.message}`}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <span className="text-foreground break-words flex-1 font-mono">
                {item.message}
              </span>
              <span className="text-muted-foreground tabular-nums flex-shrink-0">
                ×{item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Sparkline({
  values,
  accent = 'default',
}: {
  values: number[];
  accent?: 'default' | 'danger';
}) {
  if (values.length < 2) return <div className="h-full" />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const stroke =
    accent === 'danger' ? 'var(--color-danger, #ef4444)' : 'currentColor';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full h-full ${
        accent === 'danger' ? 'text-danger' : 'text-accent'
      }`}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function deriveMetrics(logs: SwarmLogEntry[]) {
  const total = logs.length;
  const failed = logs.filter((l) => !l.success);
  const failedCount = failed.length;

  const errorRate = total > 0 ? (failedCount / total) * 100 : null;

  const sizes = logs
    .map((l) => l.usage?.input_tokens)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  const avgRequestSize =
    sizes.length > 0
      ? sizes.reduce((sum, n) => sum + n, 0) / sizes.length
      : null;

  const rateLimitCount = countRateLimits(logs);

  const topErrors = topErrorMessages(failed);

  return {
    totalRequests: {
      value: total > 0 ? total : null,
      unit: total === 1 ? 'request' : 'requests',
      series: [] as number[],
    },
    e2eLatency: { value: null, unit: 'ms', series: [] as number[] },
    ttft: { value: null, unit: 'ms', series: [] as number[] },
    meanItl: { value: null, unit: 'ms', series: [] as number[] },
    avgRequestSize: {
      value: avgRequestSize,
      unit: 'tokens',
      series: [] as number[],
    },
    errorRate: {
      value: errorRate,
      unit: '%',
      series: [] as number[],
    },
    rateLimitEvents: {
      value: rateLimitCount > 0 ? rateLimitCount : null,
      unit: 'events',
      series: [] as number[],
    },
    topErrors,
  };
}

function extractStatusCode(log: SwarmLogEntry): number | null {
  const raw = log.raw;
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const candidates = [
    rec.status_code,
    rec.statusCode,
    rec.status,
    (rec.response as any)?.status_code,
    (rec.response as any)?.status,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isInteger(c) && c >= 100 && c < 600) {
      return c;
    }
  }
  return null;
}

function countRateLimits(logs: SwarmLogEntry[]): number {
  return logs.filter((log) => {
    const code = extractStatusCode(log);
    if (code === 429) return true;
    const raw = JSON.stringify(log.raw ?? '').toLowerCase();
    return raw.includes('rate limit') || raw.includes('rate_limit');
  }).length;
}

function topErrorMessages(
  failed: SwarmLogEntry[]
): { message: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const log of failed) {
    const msg = extractErrorMessage(log);
    if (!msg) continue;
    counts.set(msg, (counts.get(msg) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function extractErrorMessage(log: SwarmLogEntry): string | null {
  const raw = log.raw;
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const candidates = [
    rec.error,
    rec.error_message,
    rec.message,
    (rec.error as any)?.message,
    (rec.response as any)?.error,
    (rec.response as any)?.error_message,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return ' - ';
  if (Math.abs(n) >= 1000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  if (Math.abs(n) >= 10) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const fmt = (d: Date, includeYear: boolean) =>
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
  const time = e.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fmt(s, !sameYear)} - ${fmt(e, true)} ${time}`;
}
