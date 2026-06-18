'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useObservabilityMetrics } from '@/lib/hooks/useObservabilityMetrics';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, AlertTriangle, Calendar, ChevronDown, Clock,
  DollarSign, Filter, Globe, Loader2, RefreshCw, ShieldAlert, Timer, ToggleLeft,
  ToggleRight, XCircle,
} from 'lucide-react';
import type { ChartTab, Granularity, GroupBy, MetricBucket, TimeRange, TopGroup } from '@/types/observability';
import { GRANULARITY_OPTIONS, GROUP_BY_OPTIONS, TIME_RANGE_OPTIONS } from '@/types/observability';

const TABS: ChartTab[] = ['throughput', 'latency', 'errors', 'cost', 'tokens'];

function fmtMs(n: number | null) { return n === null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n.toFixed(0)}ms`; }
function fmtCost(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`; }
function fmtNum(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtTs(ts: string, gran: Granularity) {
  const d = new Date(ts);
  if (gran === '1d') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (gran === '1h' || gran === '15m') return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleTimeString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Math.abs(n) >= 10) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatRange(start: number, end: number): string {
  const s = new Date(start), e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const fmt = (d: Date, includeYear: boolean) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}) });
  const time = e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${fmt(s, !sameYear)} - ${fmt(e, true)} ${time}`;
}

const TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const GRID = { strokeDasharray: '3 3', stroke: 'var(--border)' };

function CustomTooltip({ active, payload, label, gran, fmt }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string; gran: Granularity; fmt: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background/95 px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-foreground mb-1.5">{fmtTs(label ?? '', gran)}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>{p.name}</span><span className="font-medium text-foreground tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const RANGE_MS: Record<TimeRange, number> = { '15m': 15 * 60_000, '1h': 3_600_000, '24h': 86_400_000, '7d': 602_880_000, '30d': 2_592_000_000, 'custom': 0 };

function computeRange(range: TimeRange, customFrom?: number, customTo?: number) {
  const now = Date.now();
  if (range === 'custom') return { start: customFrom ?? now - 86_400_000, end: customTo ?? now };
  return { start: now - RANGE_MS[range], end: now };
}

export default function ObservabilityPage() {
  const { data, isLoading, error, degraded, autoRefresh, setAutoRefresh, refetch, range, granularity, groupBy, setRange, setGranularity, setGroupBy, customFrom, customTo } = useObservabilityMetrics();
  const [chartTab, setChartTab] = useState<ChartTab>('throughput');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => computeRange(range, customFrom, customTo), [range, customFrom, customTo]);

  const chartData = useMemo(() => data?.buckets.map((b: MetricBucket) => ({
    ts: b.ts, Requests: b.requests, Errors: b.errors,
    'p50 (ms)': b.latency_p50, 'p95 (ms)': b.latency_p95, 'p99 (ms)': b.latency_p99,
    'Cost ($)': b.total_cost, 'Input tokens': b.input_tokens, 'Output tokens': b.output_tokens,
    'Error rate': b.requests > 0 ? (b.errors / b.requests) * 100 : 0,
  })) ?? [], [data]);

  const totals = data?.totals;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Observability</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Metrics</h1>
            <p className="text-sm text-muted-foreground">Operational metrics from <code className="text-foreground">/api/observability/metrics</code>.</p>
          </div>

          <ControlsBar {...{ range, granularity, groupBy, autoRefresh, setRange, setGranularity, setGroupBy, setAutoRefresh, refetch, isLoading, rangeStart, rangeEnd }} />

          {degraded && !bannerDismissed && (
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 mb-5 text-xs">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Degraded mode</p>
                <p className="text-muted-foreground mt-0.5">Metrics DB unavailable — showing estimated data from recent log entries.</p>
              </div>
              <button type="button" onClick={() => setBannerDismissed(true)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss"><XCircle className="w-4 h-4" /></button>
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center mb-6">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button type="button" onClick={refetch} className="text-sm text-accent hover:underline">Retry</button>
            </div>
          ) : isLoading && !data ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center mb-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading metrics…</p>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-5">
              <KpiRow totals={totals} chartData={chartData} />

              {totals && totals.top_errors.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <TopErrorsCard items={totals.top_errors} />
                </div>
              )}

              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-1 border-b border-border px-4 pt-4">
                  {TABS.map(t => (
                    <button key={t} type="button" onClick={() => setChartTab(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${chartTab === t ? 'bg-background text-foreground border border-border border-b-background -mb-px' : 'text-muted-foreground hover:text-foreground'}`}>
                      {t === 'throughput' ? 'Throughput' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartTab === 'throughput' ? (
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid {...GRID} /><XAxis dataKey="ts" tickFormatter={v => fmtTs(v as string, granularity)} tick={TICK} tickLine={false} axisLine={false} /><YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtNum} width={50} />
                          <Tooltip content={<CustomTooltip gran={granularity} fmt={fmtNum} />} />
                          <Area type="monotone" dataKey="Requests" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                      ) : chartTab === 'latency' ? (
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid {...GRID} /><XAxis dataKey="ts" tickFormatter={v => fmtTs(v as string, granularity)} tick={TICK} tickLine={false} axisLine={false} /><YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} width={55} />
                          <Tooltip content={<CustomTooltip gran={granularity} fmt={v => `${v}ms`} />} />
                          <Line type="monotone" dataKey="p50 (ms)" stroke="var(--success)" strokeWidth={1.5} dot={false} /><Line type="monotone" dataKey="p95 (ms)" stroke="var(--accent)" strokeWidth={1.5} dot={false} /><Line type="monotone" dataKey="p99 (ms)" stroke="var(--danger)" strokeWidth={1.5} dot={false} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </LineChart>
                      ) : chartTab === 'errors' ? (
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid {...GRID} /><XAxis dataKey="ts" tickFormatter={v => fmtTs(v as string, granularity)} tick={TICK} tickLine={false} axisLine={false} /><YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtNum} width={50} />
                          <Tooltip content={<CustomTooltip gran={granularity} fmt={fmtNum} />} />
                          <Bar dataKey="Errors" fill="var(--danger)" fillOpacity={0.7} /><Bar dataKey="Error rate" fill="var(--accent)" fillOpacity={0.4} />
                        </BarChart>
                      ) : chartTab === 'cost' ? (
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid {...GRID} /><XAxis dataKey="ts" tickFormatter={v => fmtTs(v as string, granularity)} tick={TICK} tickLine={false} axisLine={false} /><YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={55} />
                          <Tooltip content={<CustomTooltip gran={granularity} fmt={v => `$${v.toFixed(2)}`} />} />
                          <Area type="monotone" dataKey="Cost ($)" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                      ) : (
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid {...GRID} /><XAxis dataKey="ts" tickFormatter={v => fmtTs(v as string, granularity)} tick={TICK} tickLine={false} axisLine={false} /><YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtNum} width={60} />
                          <Tooltip content={<CustomTooltip gran={granularity} fmt={fmtNum} />} />
                          <Area type="monotone" dataKey="Input tokens" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} strokeWidth={1.5} /><Area type="monotone" dataKey="Output tokens" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  {chartTab === 'latency' && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--success)] inline-block" /> p50</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--accent)] inline-block" /> p95</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--danger)] inline-block" /> p99</span>
                    </div>
                  )}
                </div>
              </div>

              {data.top_groups.length > 0 && (
                <Leaderboard groups={data.top_groups} groupBy={groupBy} />
              )}

              {data.buckets.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-subtle/50 p-10 text-center">
                  <p className="text-sm text-muted-foreground">No data for this range. Try a different time range.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

type CtrlBarProps = {
  range: TimeRange; granularity: Granularity; groupBy: GroupBy; autoRefresh: boolean;
  setRange: (r: TimeRange) => void; setGranularity: (g: Granularity) => void;
  setGroupBy: (g: GroupBy) => void; setAutoRefresh: (v: boolean) => void;
  refetch: () => void; isLoading: boolean; rangeStart: number; rangeEnd: number;
};

function ControlsBar({ range, granularity, groupBy, autoRefresh, setRange, setGranularity, setGroupBy, setAutoRefresh, refetch, isLoading, rangeStart, rangeEnd }: CtrlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-border">
      <div className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-card text-xs text-muted-foreground">
        <Globe className="w-3.5 h-3.5" /><span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
      </div>

      <div className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-card text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="tabular-nums">{formatRange(rangeStart, rangeEnd)}</span>
      </div>

      <div className="flex items-center gap-0.5 rounded-md border border-border bg-subtle p-0.5">
        {(TIME_RANGE_OPTIONS.filter(o => o.value !== 'custom')).map(opt => (
          <button key={opt.value} type="button" onClick={() => setRange(opt.value)}
            className={`px-2.5 h-7 rounded text-xs font-medium transition-colors ${range === opt.value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      <SelectField label="Granularity" value={granularity} onChange={v => setGranularity(v as Granularity)} options={GRANULARITY_OPTIONS} />
      <SelectField label="Group by" value={groupBy} onChange={v => setGroupBy(v as GroupBy)} options={GROUP_BY_OPTIONS} />

      <button type="button" onClick={() => setAutoRefresh(!autoRefresh)}
        className={`flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-card text-xs ${autoRefresh ? 'text-accent' : 'text-muted-foreground'}`}>
        {autoRefresh ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}<span>Auto</span>
      </button>

      <div className="ml-auto">
        <button type="button" onClick={refetch} disabled={isLoading} aria-label="Refresh"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="relative inline-flex items-center">
        <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-transparent pr-5 text-foreground text-xs focus:outline-none cursor-pointer">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-0 pointer-events-none" />
      </span>
    </label>
  );
}

type KpiProps = {
  totals?: {
    requests: number; errors: number; latency_p50: number | null; latency_p95: number | null;
    latency_p99: number | null; total_cost: number; input_tokens: number; output_tokens: number;
    rate_limit_events: number; top_errors: Array<{ message: string; count: number }>;
  } | null;
  chartData: Record<string, unknown>[];
};

function KpiRow({ totals, chartData }: KpiProps) {
  if (!totals) return null;
  const cards = [
    { title: 'Total Requests', value: totals.requests, fmt: fmtNum, unit: 'reqs', icon: Activity, series: chartData.map((d: Record<string, unknown>) => d.Requests as number) },
    { title: 'Avg Latency (p50)', value: totals.latency_p50, fmt: fmtMs, unit: 'ms', icon: Timer, series: chartData.map((d: Record<string, unknown>) => d['p50 (ms)'] as number) },
    { title: 'Error Rate', value: totals.requests > 0 ? (totals.errors / totals.requests) * 100 : 0, fmt: fmtPct, unit: '%', icon: AlertTriangle, series: chartData.map((d: Record<string, unknown>) => d['Error rate'] as number), accent: 'danger' as const },
    { title: 'Total Cost', value: totals.total_cost, fmt: fmtCost, unit: '', icon: DollarSign, series: chartData.map((d: Record<string, unknown>) => d['Cost ($)'] as number) },
    { title: 'Rate Limit Events', value: totals.rate_limit_events, fmt: (n: number) => formatNumber(n), unit: 'events', icon: ShieldAlert, series: [], accent: totals.rate_limit_events > 0 ? 'danger' as const : 'default' as const },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map(card => (
        <div key={card.title} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 min-h-[140px]">
          <div className="flex items-center gap-2">
            <card.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground">{card.title}</h3>
          </div>
          {card.value !== null ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-semibold tabular-nums ${card.accent === 'danger' ? 'text-danger' : 'text-foreground'}`}>{card.fmt(card.value)}</span>
                {card.unit && <span className="text-xs text-muted-foreground">{card.unit}</span>}
              </div>
              {card.series.length >= 2 && <div className="flex-1 min-h-[30px]"><Sparkline values={card.series} accent={card.accent ?? 'default'} /></div>}
            </>
          ) : (
            <div className="flex-1 flex items-center"><p className="text-xs text-muted-foreground">No data</p></div>
          )}
        </div>
      ))}
    </div>
  );
}

function TopErrorsCard({ items }: { items: Array<{ message: string; count: number }> }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 min-h-[160px]">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Top Error Messages</h3>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center"><p className="text-xs text-muted-foreground">No errors in the selected time range</p></div>
      ) : (
        <ul className="space-y-2 flex-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-foreground break-words flex-1 font-mono">{item.message}</span>
              <span className="text-muted-foreground tabular-nums flex-shrink-0">×{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function extractStatusCode(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const candidates = [
    rec.status_code, rec.statusCode, rec.status,
    (rec.response as Record<string, unknown>)?.status_code,
    (rec.response as Record<string, unknown>)?.status,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isInteger(c) && c >= 100 && c < 600) return c;
  }
  return null;
}

function countRateLimits(logs: Record<string, unknown>[]): number {
  return logs.filter(log => {
    const code = extractStatusCode(log);
    if (code === 429) return true;
    return JSON.stringify(log).toLowerCase().includes('rate limit');
  }).length;
}

function extractErrorMessage(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const candidates = [
    rec.error, rec.error_message, rec.message,
    (rec.error as Record<string, unknown>)?.message,
    (rec.response as Record<string, unknown>)?.error,
    (rec.response as Record<string, unknown>)?.error_message,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

function Sparkline({ values, accent = 'default' }: { values: number[]; accent?: 'default' | 'danger' }) {
  if (values.length < 2) return <div className="h-full" />;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const w = 100, h = 30;
  const points = values.map((v, i) => `${(i / (values.length - 1) * w).toFixed(1)},${(h - (v - min) / range * h).toFixed(1)}`).join(' ');
  const stroke = accent === 'danger' ? 'var(--danger, #ef4444)' : 'var(--accent)';
  return <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full" aria-hidden><polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" points={points} /></svg>;
}

function Leaderboard({ groups, groupBy }: { groups: TopGroup[]; groupBy: GroupBy }) {
  const label = GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label ?? 'Group';
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Top 10 by {label}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
              <th className="text-left font-medium pb-2 pr-4">#</th>
              <th className="text-left font-medium pb-2 pr-4">{label}</th>
              <th className="text-right font-medium pb-2 pr-4">Requests</th>
              <th className="text-right font-medium pb-2 pr-4">Errors</th>
              <th className="text-right font-medium pb-2 pr-4">Cost</th>
              <th className="text-right font-medium pb-2">p99</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={g.key} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-4 font-mono text-foreground truncate max-w-[200px]" title={g.key}>{g.key}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-foreground">{fmtNum(g.requests)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-foreground">{fmtNum(g.errors)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-foreground">{fmtCost(g.total_cost)}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{g.latency_p99 !== null ? `${g.latency_p99}ms` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
