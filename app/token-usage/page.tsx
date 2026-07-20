'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
  TokenUsageChart,
  ChartBucket,
  ChartSeries,
} from '@/components/usage/TokenUsageChart';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Table2,
  BarChart3,
  XCircle,
} from 'lucide-react';

type ViewBy = 'month' | 'week' | 'day';
type GroupBy = 'agent' | 'key' | 'none';
type Metric = 'total' | 'input' | 'output' | 'cost';

interface UsageLog {
  timestamp: string;
  keyId: string;
  agent: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

interface UsageResponse {
  logs: UsageLog[];
  keys: { id: string; name: string }[];
  truncated: boolean;
}

// Validated categorical palette (dataviz reference instance), fixed slot
// order, dark steps selected for the dark surface, never cycled past 8.
const VIZ_STYLE = `
.usage-viz {
  --viz-s1: #2a78d6; --viz-s2: #1baf7a; --viz-s3: #eda100; --viz-s4: #008300;
  --viz-s5: #4a3aa7; --viz-s6: #e34948; --viz-s7: #e87ba4; --viz-s8: #eb6834;
  --viz-other: #898781;
}
.dark .usage-viz {
  --viz-s1: #3987e5; --viz-s2: #199e70; --viz-s3: #c98500; --viz-s4: #008300;
  --viz-s5: #9085e9; --viz-s6: #e66767; --viz-s7: #d55181; --viz-s8: #d95926;
}
`;

const SERIES_COLORS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `var(--viz-s${i})`);
const OTHER_COLOR = 'var(--viz-other)';
const MAX_GROUPS = 7;

const METRIC_LABELS: Record<Metric, string> = {
  total: 'Total tokens',
  input: 'Input tokens',
  output: 'Output tokens',
  cost: 'Cost',
};

const DAY_MS = 86_400_000;

// Session-level cache keyed by period, mirroring the server route's TTLs:
// fully-elapsed periods are immutable (logs only append), the current period
// goes stale quickly. Module-level so it survives route navigation.
const CLIENT_TTL_CURRENT_MS = 60_000;
const CLIENT_TTL_PAST_MS = 60 * 60_000;
const MAX_CLIENT_CACHE_ENTRIES = 50;
const usageCache = new Map<string, { data: UsageResponse; expiresAt: number }>();

function usageCacheSet(key: string, data: UsageResponse, periodEndMs: number): void {
  usageCache.delete(key);
  usageCache.set(key, {
    data,
    expiresAt:
      Date.now() +
      (periodEndMs <= Date.now() ? CLIENT_TTL_PAST_MS : CLIENT_TTL_CURRENT_MS),
  });
  while (usageCache.size > MAX_CLIENT_CACHE_ENTRIES) {
    const oldest = usageCache.keys().next().value;
    if (oldest === undefined) break;
    usageCache.delete(oldest);
  }
}

/* ---------- period helpers (local time) ---------- */

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // Monday
  return r;
}

function startOfMonth(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(1);
  return r;
}

function startOfPeriod(d: Date, view: ViewBy): Date {
  if (view === 'month') return startOfMonth(d);
  if (view === 'week') return startOfWeek(d);
  return startOfDay(d);
}

function addPeriod(d: Date, view: ViewBy, n: number): Date {
  const r = new Date(d);
  if (view === 'month') r.setMonth(r.getMonth() + n);
  else r.setDate(r.getDate() + (view === 'week' ? 7 * n : n));
  return r;
}

function periodLabel(anchor: Date, view: ViewBy): string {
  if (view === 'month') {
    return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    const end = addPeriod(anchor, 'week', 1);
    end.setDate(end.getDate() - 1);
    const from = anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const to = end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${from} – ${to}`;
  }
  return anchor.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function makeBucketDates(anchor: Date, view: ViewBy): Date[] {
  if (view === 'day') {
    return Array.from({ length: 24 }, (_, h) => {
      const d = new Date(anchor);
      d.setHours(h);
      return d;
    });
  }
  const days =
    view === 'week'
      ? 7
      : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return d;
  });
}

function bucketIndex(ts: Date, anchor: Date, view: ViewBy, count: number): number {
  let idx: number;
  if (view === 'day') idx = ts.getHours();
  else if (view === 'month') idx = ts.getDate() - 1;
  else idx = Math.round((startOfDay(ts).getTime() - anchor.getTime()) / DAY_MS);
  return Math.min(Math.max(idx, 0), count - 1);
}

/* ---------- formatting ---------- */

function formatTokensCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return Math.round(v).toLocaleString();
}

function formatCost(v: number): string {
  if (v === 0) return '$0';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(2)}`;
}

function metricValue(log: UsageLog, metric: Metric): number {
  if (metric === 'input') return log.inputTokens;
  if (metric === 'output') return log.outputTokens;
  if (metric === 'cost') return log.cost;
  return log.totalTokens;
}

/* ---------- page ---------- */

export default function TokenUsagePage() {
  const [view, setView] = useState<ViewBy>('month');
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('agent');
  const [metric, setMetric] = useState<Metric>('total');
  const [keyFilter, setKeyFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [showTable, setShowTable] = useState(false);

  const [data, setData] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const forceRefreshRef = React.useRef(false);

  // Anchor is set on the client only, to keep prerender/hydrate output identical.
  useEffect(() => {
    setAnchor(startOfPeriod(new Date(), 'month'));
  }, []);

  useEffect(() => {
    if (!anchor) return;
    const controller = new AbortController();
    const end = addPeriod(anchor, view, 1);
    const cacheKey = `${anchor.toISOString()}|${end.toISOString()}`;
    const force = forceRefreshRef.current;
    forceRefreshRef.current = false;

    if (!force) {
      const cached = usageCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setData(cached.data);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    fetch(
      `/api/token-usage?start=${encodeURIComponent(anchor.toISOString())}&end=${encodeURIComponent(end.toISOString())}${force ? '&refresh=1' : ''}`,
      { signal: controller.signal, cache: 'no-store' },
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Failed to load token usage');
        usageCacheSet(cacheKey, body as UsageResponse, end.getTime());
        setData(body as UsageResponse);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load token usage');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [anchor, view, reloadNonce]);

  const changeView = (next: ViewBy) => {
    setView(next);
    setAnchor((prev) => startOfPeriod(prev ?? new Date(), next));
  };

  const shiftPeriod = (dir: 1 | -1) => {
    setAnchor((prev) => (prev ? addPeriod(prev, view, dir) : prev));
  };

  const atCurrentPeriod = useMemo(() => {
    if (!anchor) return true;
    return addPeriod(anchor, view, 1).getTime() > Date.now();
  }, [anchor, view]);

  const keyNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const k of data?.keys ?? []) map.set(k.id, k.name);
    return map;
  }, [data]);

  const agents = useMemo(() => {
    const set = new Set<string>();
    for (const log of data?.logs ?? []) set.add(log.agent);
    return [...set].sort();
  }, [data]);

  const filteredLogs = useMemo(
    () =>
      (data?.logs ?? []).filter(
        (log) =>
          (keyFilter === 'all' || log.keyId === keyFilter) &&
          (agentFilter === 'all' || log.agent === agentFilter),
      ),
    [data, keyFilter, agentFilter],
  );

  const totals = useMemo(() => {
    let input = 0;
    let output = 0;
    let cost = 0;
    for (const log of filteredLogs) {
      input += log.inputTokens;
      output += log.outputTokens;
      cost += log.cost;
    }
    return { input, output, cost, requests: filteredLogs.length };
  }, [filteredLogs]);

  // Series identity comes from ALL period logs (not the filtered set) so that
  // toggling the key/agent filters never repaints surviving series.
  const series: ChartSeries[] = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'total', label: METRIC_LABELS[metric], color: SERIES_COLORS[0] }];
    }
    const groupTotals = new Map<string, number>();
    for (const log of data?.logs ?? []) {
      const id = groupBy === 'agent' ? log.agent : log.keyId;
      groupTotals.set(id, (groupTotals.get(id) ?? 0) + metricValue(log, metric));
    }
    const ranked = [...groupTotals.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, MAX_GROUPS);
    const result: ChartSeries[] = top.map(([id], i) => ({
      key: id,
      label: groupBy === 'key' ? keyNames.get(id) ?? id : id,
      color: SERIES_COLORS[i],
    }));
    if (ranked.length > MAX_GROUPS) {
      result.push({ key: '__other__', label: 'Other', color: OTHER_COLOR });
    }
    return result;
  }, [data, groupBy, metric, keyNames]);

  const buckets: ChartBucket[] = useMemo(() => {
    if (!anchor) return [];
    const dates = makeBucketDates(anchor, view);
    const seriesIndex = new Map(series.map((s, i) => [s.key, i]));
    const otherIdx = seriesIndex.get('__other__');
    const result: ChartBucket[] = dates.map((d) => ({
      label:
        view === 'day'
          ? `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString(undefined, { hour: 'numeric' })}`
          : d.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
      tick:
        view === 'day'
          ? d.toLocaleTimeString(undefined, { hour: 'numeric' })
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      values: series.map(() => 0),
    }));
    for (const log of filteredLogs) {
      const ts = new Date(log.timestamp);
      const bi = bucketIndex(ts, anchor, view, result.length);
      const id = groupBy === 'agent' ? log.agent : groupBy === 'key' ? log.keyId : 'total';
      const si = seriesIndex.get(id) ?? otherIdx;
      if (si === undefined) continue;
      result[bi].values[si] += metricValue(log, metric);
    }
    return result;
  }, [anchor, view, series, filteredLogs, groupBy, metric]);

  const hasData = useMemo(
    () => buckets.some((b) => b.values.some((v) => v > 0)),
    [buckets],
  );

  const formatValue = metric === 'cost' ? formatCost : formatTokensCompact;

  const exportCsv = () => {
    if (!anchor) return;
    const header = ['Period', ...series.map((s) => s.label), 'Total'];
    const rows = buckets.map((b) => [
      b.label,
      ...b.values.map((v) => String(v)),
      String(b.values.reduce((sum, v) => sum + v, 0)),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${view}-${anchor.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrapper usage-viz">
      <style>{VIZ_STYLE}</style>
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Account</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Token usage
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Input and output tokens across your completions, by day, week, or
                month, filter by API key and agent.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  forceRefreshRef.current = true;
                  setReloadNonce((n) => n + 1);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!hasData}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter row, scopes everything below it */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <div
              className="inline-flex items-center h-8 rounded-md border border-border bg-card p-0.5"
              role="group"
              aria-label="View by"
            >
              {(['month', 'week', 'day'] as ViewBy[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changeView(v)}
                  className={`h-full px-3 rounded-[5px] text-xs capitalize transition-colors ${
                    view === v
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center h-8 rounded-md border border-border bg-card">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => shiftPeriod(-1)}
                className="h-full px-2 rounded-l-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-xs font-medium text-foreground whitespace-nowrap min-w-[104px] text-center tabular-nums">
                {anchor ? periodLabel(anchor, view) : '—'}
              </span>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => shiftPeriod(1)}
                disabled={atCurrentPeriod}
                className="h-full px-2 rounded-r-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div aria-hidden className="hidden sm:block h-4 w-px bg-border mx-1" />

            <FilterSelect
              label="Metric"
              value={metric}
              onChange={(v) => setMetric(v as Metric)}
            >
              {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
                <option key={m} value={m}>
                  {METRIC_LABELS[m]}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Group by"
              value={groupBy}
              onChange={(v) => setGroupBy(v as GroupBy)}
            >
              <option value="agent">Agent</option>
              <option value="key">API key</option>
              <option value="none">None</option>
            </FilterSelect>

            <FilterSelect
              label="API key"
              value={keyFilter}
              onChange={setKeyFilter}
              active={keyFilter !== 'all'}
            >
              <option value="all">All</option>
              {(data?.keys ?? []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Agent"
              value={agentFilter}
              onChange={setAgentFilter}
              active={agentFilter !== 'all'}
            >
              <option value="all">All</option>
              {agents.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </FilterSelect>

            <button
              type="button"
              onClick={() => setShowTable((s) => !s)}
              aria-pressed={showTable}
              className={`ml-auto inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs transition-colors ${
                showTable
                  ? 'border-accent/50 bg-accent/10 text-accent font-medium'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
              {showTable ? 'Chart' : 'Table'}
            </button>
          </div>

          {error && !data ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : !data ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading token usage…</p>
            </div>
          ) : (
            // Refetch keeps the frame: previous render holds at reduced opacity.
            <div className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {/* Stat tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatTile label="Total tokens in" value={totals.input.toLocaleString()} />
                <StatTile label="Total tokens out" value={totals.output.toLocaleString()} />
                <StatTile label="Requests" value={totals.requests.toLocaleString()} />
                <StatTile label="Total cost" value={formatCost(totals.cost)} />
              </div>

              {/* Chart / table */}
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    {METRIC_LABELS[metric]}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Completions only
                    {data.truncated &&
                      ', showing the first 20,000 logs of this period'}
                  </p>
                </div>

                {!hasData ? (
                  <div className="py-20 text-center">
                    <p className="text-sm text-muted-foreground">
                      No usage in this period
                      {keyFilter !== 'all' || agentFilter !== 'all'
                        ? ' for the selected filters'
                        : ''}
                      .
                    </p>
                  </div>
                ) : showTable ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-medium text-muted-foreground py-2 pr-4">
                            Period
                          </th>
                          {series.map((s) => (
                            <th
                              key={s.key}
                              className="text-right font-medium text-muted-foreground py-2 px-3 whitespace-nowrap"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  aria-hidden
                                  className="inline-block w-2.5 h-2.5 rounded-sm"
                                  style={{ background: s.color }}
                                />
                                {s.label}
                              </span>
                            </th>
                          ))}
                          <th className="text-right font-medium text-muted-foreground py-2 pl-3">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {buckets.map((b, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">
                              {b.label}
                            </td>
                            {b.values.map((v, vi) => (
                              <td
                                key={vi}
                                className="py-1.5 px-3 text-right tabular-nums text-foreground"
                              >
                                {metric === 'cost'
                                  ? formatCost(v)
                                  : v.toLocaleString()}
                              </td>
                            ))}
                            <td className="py-1.5 pl-3 text-right tabular-nums font-medium text-foreground">
                              {metric === 'cost'
                                ? formatCost(b.values.reduce((s, v) => s + v, 0))
                                : b.values
                                    .reduce((s, v) => s + v, 0)
                                    .toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <TokenUsageChart
                    buckets={buckets}
                    series={series}
                    formatValue={formatValue}
                  />
                )}

                {/* Legend, only for 2+ series */}
                {series.length > 1 && hasData && (
                  <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-border">
                    {series.map((s) => (
                      <span
                        key={s.key}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <span
                          aria-hidden
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: s.color }}
                        />
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  active = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`relative inline-flex items-center h-8 rounded-md border transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background ${
        active
          ? 'border-accent/50 bg-accent/10'
          : 'border-border bg-card hover:border-border-strong'
      }`}
    >
      <span
        className={`pl-2.5 text-xs whitespace-nowrap ${
          active ? 'text-accent/80' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-full appearance-none bg-transparent pl-1.5 pr-7 text-xs font-medium max-w-[150px] truncate cursor-pointer focus:outline-none ${
          active ? 'text-accent' : 'text-foreground'
        }`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className={`absolute right-2 w-3.5 h-3.5 pointer-events-none ${
          active ? 'text-accent/80' : 'text-muted-foreground'
        }`}
      />
    </label>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}
