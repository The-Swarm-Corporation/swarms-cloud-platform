'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useObservabilityMetrics } from '@/lib/hooks/useObservabilityMetrics';
import { ObservabilityKpiCards } from '@/components/observability/ObservabilityKpiCards';
import {
  ThroughputChart,
  LatencyChart,
  ErrorsChart,
  CostChart,
  TokensChart,
} from '@/components/observability/ObservabilityCharts';
import { TopGroupsPanel } from '@/components/observability/TopGroupsPanel';
import type { TimeRange, Granularity, GroupByDimension, MetricTab } from '@/types/observability';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: 'Last 15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

const GRAN_OPTIONS: Granularity[] = ['1m', '5m', '1h', '1d'];

const GROUP_OPTIONS: { label: string; value: GroupByDimension }[] = [
  { label: 'None', value: 'none' },
  { label: 'Agent', value: 'agent' },
  { label: 'Model', value: 'model' },
  { label: 'Endpoint', value: 'endpoint' },
  { label: 'Swarm type', value: 'swarm_type' },
];

const TABS: { id: MetricTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'throughput', label: 'Throughput', icon: Activity },
  { id: 'latency', label: 'Latency', icon: Timer },
  { id: 'errors', label: 'Errors', icon: XCircle },
  { id: 'cost', label: 'Cost', icon: DollarSign },
  { id: 'tokens', label: 'Tokens', icon: Zap },
];

function suggestGranularity(range: TimeRange): Granularity {
  switch (range) {
    case '15m':
    case '1h':
      return '1m';
    case '24h':
      return '5m';
    case '7d':
      return '1h';
    case '30d':
    default:
      return '1d';
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ObservabilityPage() {
  const [range, setRange] = useState<TimeRange>('24h');
  const [granularity, setGranularity] = useState<Granularity | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<GroupByDimension>('none');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<MetricTab>('throughput');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveGranularity = granularity ?? suggestGranularity(range);

  const params = useMemo(() => {
    const base: Parameters<typeof useObservabilityMetrics>[0] = {
      range,
      groupBy,
      granularity: effectiveGranularity,
    };
    if (range === 'custom') {
      base.from = customFrom;
      base.to = customTo;
    }
    return base;
  }, [range, groupBy, effectiveGranularity, customFrom, customTo]);

  const { data, isLoading, error, refetch } = useObservabilityMetrics(params);

  /* Auto-refresh */
  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = setInterval(() => refetch(), 30_000);
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [autoRefresh, refetch]);

  /* Reset granularity when range changes */
  useEffect(() => {
    setGranularity(undefined);
  }, [range]);

  const handleRangeChange = useCallback((next: TimeRange) => {
    setRange(next);
    setShowCustom(next === 'custom');
  }, []);

  const activeChart = useCallback(
    (metrics: NonNullable<typeof data>) => {
      switch (activeTab) {
        case 'throughput':
          return <ThroughputChart data={metrics} />;
        case 'latency':
          return <LatencyChart data={metrics} />;
        case 'errors':
          return <ErrorsChart data={metrics} />;
        case 'cost':
          return <CostChart data={metrics} />;
        case 'tokens':
          return <TokensChart data={metrics} />;
      }
    },
    [activeTab],
  );

  const hasData = data && data.buckets.length > 0;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Observability
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Real-time operational metrics for your agents and swarms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data?.degraded && (
                <div className="flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Degraded mode — metrics derived from logs</span>
                  <span className="sm:hidden">Degraded</span>
                </div>
              )}
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors focus-ring"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-lg border border-border bg-card p-3 sm:p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Range picker */}
                <div className="flex items-center gap-1 rounded-md border border-border bg-subtle/50 p-0.5">
                  {RANGE_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRangeChange(r.value)}
                      className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors focus-ring ${
                        range === r.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Custom date inputs */}
                {showCustom && (
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="rounded-md border border-border bg-subtle/50 px-2 py-1 text-xs text-foreground focus-ring"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <input
                      type="datetime-local"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="rounded-md border border-border bg-subtle/50 px-2 py-1 text-xs text-foreground focus-ring"
                    />
                  </div>
                )}

                {/* Granularity */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="relative">
                    <select
                      value={effectiveGranularity}
                      onChange={(e) => setGranularity(e.target.value as Granularity)}
                      className="appearance-none rounded-md border border-border bg-card px-2.5 py-1.5 pr-7 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer focus-ring"
                    >
                      {GRAN_OPTIONS.map((g) => (
                        <option key={g} value={g} className="bg-card text-foreground">
                          {g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Group by */}
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="relative">
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as GroupByDimension)}
                      className="appearance-none rounded-md border border-border bg-card px-2.5 py-1.5 pr-7 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer focus-ring"
                    >
                      {GROUP_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value} className="bg-card text-foreground">
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-border text-accent focus-ring"
                  />
                  <span className="text-xs text-muted-foreground">Auto-refresh</span>
                </label>
                <div
                  className="hidden sm:flex items-center gap-1 rounded-md border border-border bg-subtle/50 px-2 py-1 text-xs text-muted-foreground"
                  title={new Date().toISOString()}
                >
                  <Calendar className="w-3 h-3" />
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 mb-6 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && !data && (
            <div className="space-y-4 mb-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-lg bg-muted/40" />
                ))}
              </div>
              <div className="h-80 rounded-lg bg-muted/40" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && !hasData && (
            <div className="rounded-lg border border-border bg-card p-8 text-center mb-6">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm font-medium text-foreground">No metrics found</div>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting the time range or check back after running some agents.
              </p>
            </div>
          )}

          {/* Main content */}
          {hasData && (
            <>
              <ObservabilityKpiCards data={data} />

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 mb-6">
                <div className="flex flex-col gap-4">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 rounded-md border border-border bg-subtle/50 p-0.5 w-fit">
                    {TABS.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors focus-ring ${
                            activeTab === t.id
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Chart */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">
                        {TABS.find((t) => t.id === activeTab)?.label}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {data.range.from.slice(0, 16).replace('T', ' ')} →{' '}
                        {data.range.to.slice(0, 16).replace('T', ' ')}
                      </div>
                    </div>
                    {activeChart(data)}
                  </div>
                </div>

                {/* Right rail */}
                <div className="flex flex-col gap-4">
                  <TopGroupsPanel data={data} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
