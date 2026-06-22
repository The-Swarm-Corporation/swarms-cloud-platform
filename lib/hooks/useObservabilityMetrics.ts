'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';
import type {
  TimeRange,
  Granularity,
  GroupByDimension,
  ObservabilityMetricsResponse,
} from '@/types/observability';

interface Params {
  range: TimeRange;
  from?: string;
  to?: string;
  granularity?: Granularity;
  groupBy: GroupByDimension;
  refresh?: boolean;
}

type State = {
  data: ObservabilityMetricsResponse | null;
  isLoading: boolean;
  error: string | null;
};

function buildQuery(params: Params): string {
  const sp = new URLSearchParams();
  sp.set('range', params.range);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.granularity) sp.set('granularity', params.granularity);
  sp.set('group_by', params.groupBy);
  if (params.refresh) sp.set('refresh', '1');
  return `/api/observability/metrics?${sp.toString()}`;
}

export function useObservabilityMetrics(params: Params) {
  const [state, setState] = useState<State>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async (force = false) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const url = buildQuery({ ...params, refresh: force });
      const res = await apiFetch(url, { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as ObservabilityMetricsResponse;
      setState({ data, isLoading: false, error: null });
    } catch (e: any) {
      setState({ data: null, isLoading: false, error: e?.message || 'Failed to load metrics' });
    }
  }, [params.range, params.from, params.to, params.granularity, params.groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
