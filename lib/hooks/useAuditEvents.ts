'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';
import type { AuditEvent } from '@/lib/audit/types';
import type { AuditCategory } from '@/lib/audit/types';

interface AuditEventsState {
  events: AuditEvent[];
  count: number | null;
  isLoading: boolean;
  error: string | null;
}

interface FetchOptions {
  limit?: number;
  offset?: number;
  search?: string;
  category?: AuditCategory | '';
  actor?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditEvents() {
  const [state, setState] = useState<AuditEventsState>({
    events: [],
    count: null,
    isLoading: true,
    error: null,
  });

  const [options, setOptions] = useState<FetchOptions>({
    limit: 50,
    offset: 0,
    search: '',
    category: '',
    actor: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchEvents = useCallback(async (opts?: FetchOptions) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      params.set('limit', String(opts?.limit ?? options.limit ?? 50));
      params.set('offset', String(opts?.offset ?? options.offset ?? 0));
      if (opts?.search !== undefined) params.set('search', opts.search);
      else if (options.search) params.set('search', options.search);
      if (opts?.category !== undefined) params.set('category', opts.category);
      else if (options.category) params.set('category', options.category);
      if (opts?.actor !== undefined) params.set('actor', opts.actor);
      else if (options.actor) params.set('actor', options.actor);
      if (opts?.dateFrom !== undefined) params.set('dateFrom', opts.dateFrom);
      else if (options.dateFrom) params.set('dateFrom', options.dateFrom);
      if (opts?.dateTo !== undefined) params.set('dateTo', opts.dateTo);
      else if (options.dateTo) params.set('dateTo', options.dateTo);

      const res = await apiFetch(`/api/audit/events?${params.toString()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Failed to fetch audit events');
      }

      const data = await res.json();
      setState({
        events: data.events ?? [],
        count: data.count ?? 0,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e?.message ?? 'Unknown error',
      }));
    }
  }, [options]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const refetch = useCallback(() => fetchEvents({ offset: 0 }), [fetchEvents]);

  const setSearch = useCallback((search: string) => {
    setOptions((o) => ({ ...o, search, offset: 0 }));
    fetchEvents({ search, offset: 0 });
  }, [fetchEvents]);

  const setCategory = useCallback((category: AuditCategory | '') => {
    setOptions((o) => ({ ...o, category, offset: 0 }));
    fetchEvents({ category, offset: 0 });
  }, [fetchEvents]);

  const setActor = useCallback((actor: string) => {
    setOptions((o) => ({ ...o, actor, offset: 0 }));
    fetchEvents({ actor, offset: 0 });
  }, [fetchEvents]);

  const setDateRange = useCallback((dateFrom: string, dateTo: string) => {
    setOptions((o) => ({ ...o, dateFrom, dateTo, offset: 0 }));
    fetchEvents({ dateFrom, dateTo, offset: 0 });
  }, [fetchEvents]);

  const setOffset = useCallback((offset: number) => {
    setOptions((o) => ({ ...o, offset }));
    fetchEvents({ offset });
  }, [fetchEvents]);

  return {
    events: state.events,
    count: state.count,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    setSearch,
    setCategory,
    setActor,
    setDateRange,
    setOffset,
    options,
  };
}
