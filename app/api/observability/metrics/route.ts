import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import type {
  Granularity,
  GroupByDimension,
  ObservabilityBucket,
  ObservabilityTotals,
  TopGroupItem,
  ObservabilityMetricsResponse,
} from '@/types/observability';

const NO_STORE = 'private, no-store';
const CACHE_TTL_MS = 30_000;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function parseRange(
  rangeParam: string | null,
  fromParam: string | null,
  toParam: string | null,
): { startMs: number; endMs: number } {
  const now = Date.now();
  const endMs = now;

  const minutes = (n: number) => n * 60 * 1000;
  const hours = (n: number) => n * 60 * minutes(1);
  const days = (n: number) => n * 24 * hours(1);

  switch (rangeParam) {
    case '15m':
      return { startMs: now - minutes(15), endMs };
    case '1h':
      return { startMs: now - hours(1), endMs };
    case '24h':
      return { startMs: now - days(1), endMs };
    case '7d':
      return { startMs: now - days(7), endMs };
    case '30d':
      return { startMs: now - days(30), endMs };
    default: {
      const fromMs = fromParam ? new Date(fromParam).getTime() : now - days(1);
      const toMs = toParam ? new Date(toParam).getTime() : now;
      return {
        startMs: Number.isFinite(fromMs) ? fromMs : now - days(1),
        endMs: Number.isFinite(toMs) ? toMs : now,
      };
    }
  }
}

function parseGranularity(
  param: string | null,
  rangeMs: number,
): Granularity {
  const explicit = param as Granularity | null;
  if (explicit && ['1m', '5m', '1h', '1d'].includes(explicit)) return explicit;

  if (rangeMs <= 1000 * 60 * 60) return '1m'; // <= 1h
  if (rangeMs <= 1000 * 60 * 60 * 24) return '5m'; // <= 24h
  if (rangeMs <= 1000 * 60 * 60 * 24 * 7) return '1h'; // <= 7d
  return '1d';
}

function granularityMs(g: Granularity): number {
  switch (g) {
    case '1m':
      return 60_000;
    case '5m':
      return 300_000;
    case '1h':
      return 3_600_000;
    case '1d':
      return 86_400_000;
  }
}

function bucketKey(tsMs: number, granMs: number): number {
  return Math.floor(tsMs / granMs) * granMs;
}

function extractLatencyMs(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const candidates = [
    rec.latency_ms,
    rec.duration_ms,
    rec.execution_time,
    rec.response_time,
    rec.latency,
    (rec.metadata as any)?.latency_ms,
    (rec.metadata as any)?.duration_ms,
    (rec.usage as any)?.latency_ms,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c) && c >= 0) return c;
  }
  return null;
}

function extractStatusCode(raw: unknown): number | null {
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

function extractGroupKey(
  log: Record<string, unknown>,
  dim: GroupByDimension,
): string | null {
  const raw = log.raw && typeof log.raw === 'object' ? (log.raw as Record<string, unknown>) : null;
  switch (dim) {
    case 'agent':
      return (log.agent_name as string) || (raw?.agent_name as string) || (log.name as string) || null;
    case 'model':
      return (raw?.model_name as string) || (log.model_name as string) || (log.model as string) || null;
    case 'endpoint':
      return (log.endpoint as string) || (raw?.endpoint as string) || (raw?.route as string) || null;
    case 'swarm_type':
      return (raw?.swarm_type as string) || (log.swarm_type as string) || null;
    default:
      return null;
  }
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const k = (sorted.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return sorted[f];
  const d = k - f;
  return sorted[f] * (1 - d) + sorted[c] * d;
}

function computeDeltas(
  buckets: ObservabilityBucket[],
  rangeMs: number,
): {
  requestsDelta: number | null;
  latencyDelta: number | null;
  errorsDelta: number | null;
  costDelta: number | null;
} {
  if (buckets.length < 2) {
    return { requestsDelta: null, latencyDelta: null, errorsDelta: null, costDelta: null };
  }
  const half = Math.ceil(buckets.length / 2);
  const first = buckets.slice(0, half);
  const second = buckets.slice(half);

  const sum = (arr: ObservabilityBucket[], key: keyof ObservabilityBucket) =>
    arr.reduce((s, b) => s + (typeof b[key] === 'number' ? (b[key] as number) : 0), 0);

  const firstReq = sum(first, 'requests');
  const secondReq = sum(second, 'requests');
  const requestsDelta = firstReq > 0 ? ((secondReq - firstReq) / firstReq) * 100 : null;

  const firstErr = sum(first, 'errors');
  const secondErr = sum(second, 'errors');
  const errorsDelta = firstErr > 0 ? ((secondErr - firstErr) / firstErr) * 100 : null;

  const firstCost = sum(first, 'total_cost');
  const secondCost = sum(second, 'total_cost');
  const costDelta = firstCost > 0 ? ((secondCost - firstCost) / firstCost) * 100 : null;

  const avgLatency = (arr: ObservabilityBucket[]) => {
    const vals = arr.map((b) => b.latency_p50).filter((n): n is number => n !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const firstLat = avgLatency(first);
  const secondLat = avgLatency(second);
  const latencyDelta = firstLat && secondLat ? ((secondLat - firstLat) / firstLat) * 100 : null;

  return { requestsDelta, latencyDelta, errorsDelta, costDelta };
}

function deriveMetricsFromLogs(
  logs: unknown[],
  startMs: number,
  endMs: number,
  gran: Granularity,
  groupBy: GroupByDimension,
): ObservabilityMetricsResponse {
  const granMs = granularityMs(gran);

  // Build all buckets so charts have zero-fill gaps
  const buckets = new Map<number, ObservabilityBucket>();
  for (let t = bucketKey(startMs, granMs); t <= endMs; t += granMs) {
    buckets.set(t, {
      ts: new Date(t).toISOString(),
      requests: 0,
      errors: 0,
      latency_p50: null,
      latency_p95: null,
      latency_p99: null,
      total_cost: null,
      total_tokens: null,
      input_tokens: null,
      output_tokens: null,
    });
  }

  const groupMap = new Map<string, TopGroupItem>();

  const latencyByBucket = new Map<number, number[]>();

  for (const rawLog of logs) {
    if (!rawLog || typeof rawLog !== 'object') continue;
    const log = rawLog as Record<string, unknown>;

    const tsStr =
      (log.timestamp as string) ||
      (log.created_at as string) ||
      (log.time as string);
    if (!tsStr) continue;
    const tsMs = new Date(tsStr).getTime();
    if (!Number.isFinite(tsMs) || tsMs < startMs || tsMs > endMs) continue;

    const bk = bucketKey(tsMs, granMs);
    const bucket = buckets.get(bk);
    if (!bucket) continue;

    const success =
      typeof log.success === 'boolean'
        ? log.success
        : typeof log.status === 'string'
        ? !/error|fail/i.test(log.status)
        : true;

    bucket.requests += 1;
    if (!success) {
      bucket.errors += 1;
    }

    const usage =
      (log.usage as Record<string, unknown> | undefined) ||
      (log.metadata as Record<string, unknown> | undefined);

    if (usage) {
      type NumKey = 'total_cost' | 'total_tokens' | 'input_tokens' | 'output_tokens';
      const add = (key: NumKey, val: unknown) => {
        if (typeof val === 'number' && Number.isFinite(val)) {
          (bucket as any)[key] = ((bucket as any)[key] ?? 0) + val;
        }
      };
      add('total_cost', usage.total_cost);
      add('total_tokens', usage.total_tokens);
      add('input_tokens', usage.input_tokens);
      add('output_tokens', usage.output_tokens);
    }

    const lat = extractLatencyMs(log);
    if (lat !== null) {
      const arr = latencyByBucket.get(bk) ?? [];
      arr.push(lat);
      latencyByBucket.set(bk, arr);
    }

    // Group aggregation
    if (groupBy !== 'none') {
      const gk = extractGroupKey(log, groupBy);
      if (gk) {
        const entry = groupMap.get(gk) ?? {
          key: gk,
          requests: 0,
          errors: 0,
          total_cost: 0,
          total_tokens: 0,
        };
        entry.requests += 1;
        if (!success) entry.errors += 1;
        if (usage) {
          const tc = usage.total_cost;
          if (typeof tc === 'number' && Number.isFinite(tc)) {
            entry.total_cost = (entry.total_cost ?? 0) + tc;
          }
          const tt = usage.total_tokens;
          if (typeof tt === 'number' && Number.isFinite(tt)) {
            entry.total_tokens = (entry.total_tokens ?? 0) + tt;
          }
        }
        groupMap.set(gk, entry);
      }
    }
  }

  // Compute latency percentiles per bucket
  for (const [bk, vals] of latencyByBucket.entries()) {
    const sorted = vals.slice().sort((a, b) => a - b);
    const bucket = buckets.get(bk)!;
    bucket.latency_p50 = percentile(sorted, 50);
    bucket.latency_p95 = percentile(sorted, 95);
    bucket.latency_p99 = percentile(sorted, 99);
  }

  const sortedBuckets = Array.from(buckets.values()).sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );

  // Totals
  const totals: ObservabilityTotals = {
    requests: 0,
    errors: 0,
    latency_p50: null,
    latency_p95: null,
    latency_p99: null,
    total_cost: null,
    total_tokens: null,
    input_tokens: null,
    output_tokens: null,
  };

  const allLatencies: number[] = [];
  for (const b of sortedBuckets) {
    totals.requests += b.requests;
    totals.errors += b.errors;
    if (b.total_cost !== null) totals.total_cost = (totals.total_cost ?? 0) + b.total_cost;
    if (b.total_tokens !== null) totals.total_tokens = (totals.total_tokens ?? 0) + b.total_tokens;
    if (b.input_tokens !== null) totals.input_tokens = (totals.input_tokens ?? 0) + b.input_tokens;
    if (b.output_tokens !== null) totals.output_tokens = (totals.output_tokens ?? 0) + b.output_tokens;
    const l = latencyByBucket.get(new Date(b.ts).getTime());
    if (l) allLatencies.push(...l);
  }

  if (allLatencies.length > 0) {
    allLatencies.sort((a, b) => a - b);
    totals.latency_p50 = percentile(allLatencies, 50);
    totals.latency_p95 = percentile(allLatencies, 95);
    totals.latency_p99 = percentile(allLatencies, 99);
  }

  const top_groups: TopGroupItem[] = Array.from(groupMap.values())
    .sort((a, b) => {
      const ac = a.total_cost ?? 0;
      const bc = b.total_cost ?? 0;
      if (bc !== ac) return bc - ac;
      return b.requests - a.requests;
    })
    .slice(0, 10);

  const rangeMs = endMs - startMs;
  const deltas = computeDeltas(sortedBuckets, rangeMs);

  return {
    degraded: true,
    range: { from: new Date(startMs).toISOString(), to: new Date(endMs).toISOString() },
    granularity: gran,
    group_by: groupBy,
    buckets: sortedBuckets,
    totals,
    deltas: {
      requests_delta: deltas.requestsDelta,
      latency_delta: deltas.latencyDelta,
      errors_delta: deltas.errorsDelta,
      cost_delta: deltas.costDelta,
    },
    top_groups,
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
      const inner = rec.logs as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items;
      if (Array.isArray(inner.data)) return inner.data;
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Swarms API key found. Sign in or create one in your Swarms account.' },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const cacheKey = user?.id ?? `_env_${apiKey.slice(-8)}`;

    const { searchParams } = request.nextUrl;
    const rangeParam = searchParams.get('range');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const { startMs, endMs } = parseRange(rangeParam, fromParam, toParam);
    const rangeMs = endMs - startMs;

    const gran = parseGranularity(searchParams.get('granularity'), rangeMs);
    const groupBy = (searchParams.get('group_by') as GroupByDimension) || 'none';
    const force = searchParams.get('refresh') === '1';

    const now = Date.now();
    const cached = cache.get(cacheKey);

    let logs: unknown[];
    if (!force && cached && cached.expiresAt > now) {
      logs = extractLogsArray(cached.data);
    } else {
      const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
      const data = await client.getSwarmLogs();
      cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
      logs = extractLogsArray(data);
    }

    const result = deriveMetricsFromLogs(logs, startMs, endMs, gran, groupBy);
    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/observability/metrics', error);
  }
}
