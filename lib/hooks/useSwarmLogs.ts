'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';

export type SwarmLogEntry = {
  id: string;
  timestamp: string | null;
  agentName: string | null;
  endpoint: string | null;
  task: string | null;
  response: unknown;
  success: boolean;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    total_cost?: number;
  } | null;
  raw: unknown;
};

function pickString(
  obj: Record<string, unknown> | null | undefined,
  keys: string[]
): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

function pickRecord(
  obj: Record<string, unknown> | null | undefined,
  keys: string[]
): Record<string, unknown> | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v))
      return v as Record<string, unknown>;
  }
  return null;
}

function normalizeUsage(
  source: Record<string, unknown> | null
): SwarmLogEntry['usage'] {
  if (!source) return null;
  const usage =
    pickRecord(source, ['usage']) ||
    pickRecord(source, ['metadata']) ||
    source;
  const out: NonNullable<SwarmLogEntry['usage']> = {};
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;

  out.input_tokens = num(usage.input_tokens) ?? num((source as any).input_tokens);
  out.output_tokens =
    num(usage.output_tokens) ?? num((source as any).output_tokens);
  out.total_tokens =
    num(usage.total_tokens) ?? num((source as any).total_tokens);
  out.total_cost = num(usage.total_cost) ?? num((source as any).total_cost);

  if (
    out.input_tokens === undefined &&
    out.output_tokens === undefined &&
    out.total_tokens === undefined &&
    out.total_cost === undefined
  ) {
    return null;
  }
  return out;
}

function normalizeLogEntry(raw: unknown, idx: number): SwarmLogEntry {
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const data = pickRecord(obj, ['data', 'payload', 'request', 'body']);
  const response = pickRecord(obj, ['response', 'output', 'result']);

  const id =
    pickString(obj, ['id', 'log_id', 'request_id', 'job_id']) ||
    pickString(data, ['id', 'job_id', 'request_id']) ||
    `log-${idx}`;

  const timestamp =
    pickString(obj, ['timestamp', 'created_at', 'createdAt', 'time']) ||
    pickString(data, ['timestamp', 'created_at']) ||
    pickString(response, ['timestamp', 'created_at']);

  const agentName =
    pickString(obj, ['agent_name', 'name']) ||
    pickString(data, ['agent_name', 'name']) ||
    pickString(pickRecord(data, ['agent_config']), ['agent_name', 'name']) ||
    pickString(response, ['name']);

  const endpoint =
    pickString(obj, ['endpoint', 'route', 'path', 'url']) ||
    pickString(data, ['endpoint', 'route', 'path']);

  const task =
    pickString(obj, ['task', 'prompt', 'query', 'input']) ||
    pickString(data, ['task', 'prompt', 'query', 'input']);

  const successFlag =
    typeof obj.success === 'boolean'
      ? (obj.success as boolean)
      : typeof obj.status === 'string'
      ? !/error|fail/i.test(obj.status as string)
      : true;

  const usage =
    normalizeUsage(response) ||
    normalizeUsage(data) ||
    normalizeUsage(obj);

  return {
    id,
    timestamp,
    agentName,
    endpoint,
    task,
    response: response ?? obj.response ?? obj.output ?? obj.result ?? null,
    success: successFlag,
    usage,
    raw,
  };
}

function extractLogsArray(payload: unknown): unknown[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    const rec = payload as Record<string, unknown>;
    if (Array.isArray(rec.logs)) return rec.logs;
    if (Array.isArray(rec.data)) return rec.data;
    if (Array.isArray(rec.results)) return rec.results;
    if (rec.logs && typeof rec.logs === 'object') {
      // Could be { logs: { items: [...] } }
      const inner = rec.logs as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items;
      if (Array.isArray(inner.data)) return inner.data;
    }
  }
  return [];
}

type State = {
  logs: SwarmLogEntry[];
  count: number | null;
  isLoading: boolean;
  error: string | null;
};

export function useSwarmLogs() {
  const [state, setState] = useState<State>({
    logs: [],
    count: null,
    isLoading: true,
    error: null,
  });

  const fetchLogs = useCallback(async (opts?: { force?: boolean }) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const url = opts?.force ? '/api/logs?refresh=1' : '/api/logs';
      const res = await apiFetch(url, { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const arr = extractLogsArray(data?.logs ?? data);
      const entries = arr.map((r, i) => normalizeLogEntry(r, i));

      entries.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });

      setState({
        logs: entries,
        count:
          typeof data?.count === 'number' ? (data.count as number) : entries.length,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
      setState({
        logs: [],
        count: null,
        isLoading: false,
        error: e?.message || 'Failed to load swarm logs',
      });
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refetch = useCallback(() => fetchLogs({ force: true }), [fetchLogs]);

  return {
    logs: state.logs,
    count: state.count,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
