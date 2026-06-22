'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ObservabilityMetricsResponse } from '@/types/observability';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

function formatAxisTick(ts: string, gran: string): string {
  const d = new Date(ts);
  if (gran === '1d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (gran === '1h') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-card shadow-md px-3 py-2 text-xs">
      <div className="text-muted-foreground mb-1 tabular-nums">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5 tabular-nums">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-foreground font-medium">{p.name}:</span>
          <span className="text-foreground">
            {formatter ? formatter(p.value, p.name) : fmtNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Charts                                                            */
/* ------------------------------------------------------------------ */

export function ThroughputChart({ data }: { data: ObservabilityMetricsResponse }) {
  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        label: formatAxisTick(b.ts, data.granularity),
        requests: b.requests,
        errors: b.errors,
      })),
    [data],
  );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="reqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0070f3" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#0070f3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgb(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={48}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => fmtNumber(v)} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="requests"
          name="Requests"
          stroke="#0070f3"
          fill="url(#reqFill)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="errors"
          name="Errors"
          stroke="#e62929"
          fill="transparent"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LatencyChart({ data }: { data: ObservabilityMetricsResponse }) {
  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        label: formatAxisTick(b.ts, data.granularity),
        p50: b.latency_p50,
        p95: b.latency_p95,
        p99: b.latency_p99,
      })),
    [data],
  );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgb(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => fmtLatency(v)}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => fmtLatency(v)} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="p50"
          name="p50"
          stroke="#0070f3"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="p95"
          name="p95"
          stroke="#e62929"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="p99"
          name="p99"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="8 4"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ErrorsChart({ data }: { data: ObservabilityMetricsResponse }) {
  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        label: formatAxisTick(b.ts, data.granularity),
        errors: b.errors,
        rate: b.requests > 0 ? (b.errors / b.requests) * 100 : 0,
      })),
    [data],
  );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgb(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          yAxisId="left"
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          yAxisId="right"
          orientation="right"
          tickFormatter={(v) => `${v.toFixed(0)}%`}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v, name) =>
                name === 'Error rate' ? `${(v as number).toFixed(1)}%` : fmtNumber(v as number)
              }
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="errors" name="Errors" fill="#e62929" yAxisId="left" />
        <Bar dataKey="rate" name="Error rate" fill="#f59e0b" yAxisId="right" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostChart({ data }: { data: ObservabilityMetricsResponse }) {
  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        label: formatAxisTick(b.ts, data.granularity),
        cost: b.total_cost ?? 0,
      })),
    [data],
  );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#009966" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#009966" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgb(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `$${v.toFixed(2)}`}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `$${(v as number).toFixed(4)}`} />} />
        <Area
          type="monotone"
          dataKey="cost"
          name="Cost"
          stroke="#009966"
          fill="url(#costFill)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TokensChart({ data }: { data: ObservabilityMetricsResponse }) {
  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        label: formatAxisTick(b.ts, data.granularity),
        input: b.input_tokens ?? 0,
        output: b.output_tokens ?? 0,
        total: b.total_tokens ?? 0,
      })),
    [data],
  );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="inFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0070f3" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#0070f3" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgb(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => fmtNumber(v as number)} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="input"
          name="Input tokens"
          stroke="#0070f3"
          fill="url(#inFill)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="output"
          name="Output tokens"
          stroke="#8b5cf6"
          fill="url(#outFill)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Total"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
