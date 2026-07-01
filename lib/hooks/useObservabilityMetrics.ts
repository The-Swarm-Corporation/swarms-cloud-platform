'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';
import type {
  MetricsResponse,
  TimeRange,
  Granularity,
  GroupBy,
} from '@/types/observability';

type State = {
  data: MetricsResponse | null;
  isLoading: boolean;
  error: string | null;
  degraded: boolean;
};

function buildUrl(params: {
  range: TimeRange;
  granularity: Granularity;
  groupBy: GroupBy;
  from?: number;
  to?: number;
  refresh?: boolean;
}): string {
  const url = new URL('/api/observability/metrics', window.location.origin);
  url.searchParams.set('range', params.range);
  url.searchParams.set('granularity', params.granularity);
  url.searchParams.set('group_by', params.groupBy);
  if (params.range === 'custom') {
    if (params.from) url.searchParams.set('from', String(params.from));
    if (params.to) url.searchParams.set('to', String(params.to));
  }
  if (params.refresh) url.searchParams.set('refresh', '1');
  return url.toString();
}

export function useObservabilityMetrics() {
  const [state, setState] = useState<State>({
    data: null,
    isLoading: true,
    error: null,
    degraded: false,
  });
  const [params, setParams] = useState<{
    range: TimeRange;
    granularity: Granularity;
    groupBy: GroupBy;
    from?: number;
    to?: number;
  }>({ range: '24h', granularity: '1h', groupBy: 'none' });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(
    async (opts?: { refresh?: boolean }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const url = buildUrl({ ...params, refresh: opts?.refresh });
        const res = await apiFetch(url, { method: 'GET' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed (${res.status})`);
        }
        const data: MetricsResponse = await res.json();
        setState({
          data,
          isLoading: false,
          error: null,
          degraded: data.degraded,
        });
      } catch (e: unknown) {
        setState({
          data: null,
          isLoading: false,
          error: e instanceof Error ? e.message : 'Failed to load metrics',
          degraded: false,
        });
      }
    },
    [params]
  );

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchMetrics({ refresh: true }), 30_000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchMetrics]);

  const refetch = useCallback(() => fetchMetrics({ refresh: true }), [fetchMetrics]);

  const setRange = useCallback((range: TimeRange) => {
    setParams((p) => ({ ...p, range }));
  }, []);

  const setGranularity = useCallback((granularity: Granularity) => {
    setParams((p) => ({ ...p, granularity }));
  }, []);

  const setGroupBy = useCallback((groupBy: GroupBy) => {
    setParams((p) => ({ ...p, groupBy }));
  }, []);

  const setCustomRange = useCallback((from: number, to: number) => {
    setParams((p) => ({ ...p, range: 'custom', from, to }));
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    degraded: state.degraded,
    autoRefresh,
    setAutoRefresh,
    refetch,
    range: params.range,
    granularity: params.granularity,
    groupBy: params.groupBy,
    customFrom: params.from,
    customTo: params.to,
    setRange,
    setGranularity,
    setGroupBy,
    setCustomRange,
  };
}
