'use client';

import { useCallback, useEffect, useState } from 'react';
import { AgentConfig } from '@/types/agent';
import { apiFetch } from '@/lib/api/client-fetch';

type State = {
  configs: AgentConfig[];
  isLoading: boolean;
  error: string | null;
};

function normalizeConfigsPayload(payload: unknown): AgentConfig[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as AgentConfig[];
  if (typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.data)) return rec.data as AgentConfig[];
    if (Array.isArray(rec.agents)) return rec.agents as AgentConfig[];
    if (Array.isArray(rec.configurations))
      return rec.configurations as AgentConfig[];
    if (Array.isArray(rec.results)) return rec.results as AgentConfig[];
  }
  return [];
}

export function useAgentConfigsList() {
  const [state, setState] = useState<State>({
    configs: [],
    isLoading: true,
    error: null,
  });

  const fetchConfigs = useCallback(async (opts?: { force?: boolean }) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const url = opts?.force
        ? '/api/agents/list?refresh=1'
        : '/api/agents/list';
      const res = await apiFetch(url, { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const configs = normalizeConfigsPayload(data);
      setState({ configs, isLoading: false, error: null });
    } catch (e: any) {
      setState({
        configs: [],
        isLoading: false,
        error: e?.message || 'Failed to load agent configurations',
      });
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const refetch = useCallback(
    () => fetchConfigs({ force: true }),
    [fetchConfigs]
  );

  return {
    configs: state.configs,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
