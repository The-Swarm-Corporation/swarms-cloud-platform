import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import type { MetricsResponse, MetricBucket, TopGroup, TimeRange, Granularity, GroupBy } from '@/types/observability';

const NO_STORE = 'private, no-store';
const CACHE_TTL_MS = 60_000;
type CacheEntry = { data: MetricsResponse; expiresAt: number };
const cache = new Map<string, CacheEntry>();

const RANGE_MS: Record<TimeRange, number> = {
  '15m': 15 * 60_000, '1h': 3_600_000, '24h': 86_400_000,
  '7d': 602_880_000, '30d': 2_592_000_000, 'custom': 0,
};

const GRANULARITY_SECS: Record<Granularity, number> = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3_600, '1d': 86_400,
};

const DERIVE_GRAN: Record<TimeRange, Granularity> = {
  '15m': '1m', '1h': '5m', '24h': '1h', '7d': '1h', '30d': '1d', 'custom': '1h',
};

function parseParams(url: NextRequest['nextUrl']) {
  const range = (url.searchParams.get('range') ?? '24h') as TimeRange;
  const granularity = (url.searchParams.get('granularity') as Granularity) ?? DERIVE_GRAN[range];
  const groupBy = (url.searchParams.get('group_by') ?? 'none') as GroupBy;
  let from: number, to: number;
  if (range === 'custom') {
    from = parseInt(url.searchParams.get('from') ?? '0', 10) || Date.now() - RANGE_MS['24h'];
    to = parseInt(url.searchParams.get('to') ?? '0', 10) || Date.now();
  } else {
    from = Date.now() - RANGE_MS[range];
    to = Date.now();
  }
  return { range, granularity, groupBy, from, to };
}

function pct(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] ?? null;
}

function sum<T>(arr: T[], fn: (t: T) => number) { return arr.reduce((a, t) => a + fn(t), 0); }

function buildBuckets(
  rows: Record<string, unknown>[],
  granSecs: number,
  from: number,
  to: number
): { buckets: MetricBucket[]; topMap: Map<string, TopGroup> } {
  const map = new Map<number, { ts: string; requests: number; errors: number; latencies: number[]; total_cost: number; input_tokens: number; output_tokens: number; dim_key: string | null }>();

  for (const r of rows) {
    const rawTs = (r.bucket_ts ?? r.timestamp) as string;
    if (!rawTs) continue;
    const ts = new Date(rawTs).getTime();
    if (isNaN(ts) || ts < from || ts > to) continue;
    const bucketKey = Math.floor(ts / (granSecs * 1000)) * (granSecs * 1000);
    const dimKey = (r.dim_key as string | null) ?? 'all';

    if (!map.has(bucketKey)) {
      map.set(bucketKey, { ts: new Date(bucketKey).toISOString(), requests: 0, errors: 0, latencies: [], total_cost: 0, input_tokens: 0, output_tokens: 0, dim_key: dimKey });
    }
    const b = map.get(bucketKey)!;
    b.requests += (r.requests as number) ?? 0;
    b.errors += (r.errors as number) ?? 0;
    b.total_cost += (r.total_cost_usd as number) ?? 0;
    b.input_tokens += (r.input_tokens as number) ?? 0;
    b.output_tokens += (r.output_tokens as number) ?? 0;
    if (Array.isArray(r.latencies)) b.latencies.push(...(r.latencies as number[]));
  }

  const buckets: MetricBucket[] = [];
  const topMap = new Map<string, TopGroup>();

  for (const [, b] of map) {
    const sorted = [...b.latencies].sort((a, c) => a - c);
    const p50 = pct(sorted, 50);
    const p95 = pct(sorted, 95);
    const p99 = pct(sorted, 99);
    buckets.push({ ts: b.ts, requests: b.requests, errors: b.errors, latency_p50: p50, latency_p95: p95, latency_p99: p99, total_cost: b.total_cost, input_tokens: b.input_tokens, output_tokens: b.output_tokens });

    const gKey = b.dim_key ?? 'all';
    const ex = topMap.get(gKey);
    if (ex) {
      ex.requests += b.requests; ex.errors += b.errors; ex.total_cost += b.total_cost;
      if (p99 !== null && (ex.latency_p99 === null || p99 > ex.latency_p99)) ex.latency_p99 = p99;
    } else {
      topMap.set(gKey, { key: gKey, requests: b.requests, errors: b.errors, total_cost: b.total_cost, latency_p99: p99 });
    }
  }

  buckets.sort((a, c) => new Date(a.ts).getTime() - new Date(c.ts).getTime());
  return { buckets, topMap };
}

async function queryDb(userId: string, from: number, to: number, granSecs: number, dimCol: string | null): Promise<{ buckets: MetricBucket[]; topMap: Map<string, TopGroup> } | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const cols = dimCol
    ? `bucket_ts, requests, errors, total_cost_usd, input_tokens, output_tokens, ${dimCol} as dim_key, latencies`
    : 'bucket_ts, requests, errors, total_cost_usd, input_tokens, output_tokens, latencies, \'all\'::text as dim_key';

  try {
    const { data, error } = await supabase
      .from('observability_metrics')
      .select(cols)
      .eq('user_id', userId)
      .gte('bucket_ts', new Date(from).toISOString())
      .lte('bucket_ts', new Date(to).toISOString())
      .order('bucket_ts', { ascending: true });

    if (error || !data?.length) return null;
    return buildBuckets(data as unknown as Record<string, unknown>[], granSecs, from, to);
  } catch { return null; }
}

async function fallbackMetrics(apiKey: string, from: number, to: number, granMs: number) {
  const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
  const raw = await client.getSwarmLogs();
  const logArr: unknown[] = Array.isArray(raw?.logs) ? raw.logs : Array.isArray(raw) ? raw : [];

  const bucketsMap = new Map<number, { ts: string; requests: number; errors: number; latencies: number[]; total_cost: number; input_tokens: number; output_tokens: number }>();
  const errorMsgCounts = new Map<string, number>();

  for (const entry of logArr) {
    if (!entry || typeof entry !== 'object') continue;
    const r = entry as Record<string, unknown>;
    const ts = new Date((r.timestamp ?? r.created_at ?? r.createdAt) as string).getTime();
    if (!Number.isFinite(ts) || ts < from || ts > to) continue;
    const bKey = Math.floor(ts / granMs) * granMs;
    if (!bucketsMap.has(bKey)) bucketsMap.set(bKey, { ts: new Date(bKey).toISOString(), requests: 0, errors: 0, latencies: [], total_cost: 0, input_tokens: 0, output_tokens: 0 });
    const b = bucketsMap.get(bKey)!;
    b.requests++;

    const success = typeof r.success === 'boolean' ? r.success : !/(?:error|fail)/i.test(String(r.status ?? ''));
    const rawStatus = (r.status_code ?? r.status ?? (r.response as Record<string, unknown>)?.status_code ?? (r.response as Record<string, unknown>)?.status) as number | undefined;
    const isRateLimit = rawStatus === 429;

    if (!success) {
      b.errors++;
      if (isRateLimit) b.errors; // counted separately below
      const errMsg = extractErrMsg(r);
      if (errMsg) errorMsgCounts.set(errMsg, (errorMsgCounts.get(errMsg) ?? 0) + 1);
    }

    const latency = (r.latency_ms ?? r.duration_ms ?? (r.response as Record<string, unknown>)?.latency_ms) as number | null;
    if (latency != null) b.latencies.push(latency);
    const usage = ((r.usage ?? (r.response as Record<string, unknown>)?.usage) as Record<string, number | undefined> | null);
    if (usage) { b.total_cost += usage.total_cost ?? 0; b.input_tokens += usage.input_tokens ?? 0; b.output_tokens += usage.output_tokens ?? 0; }
  }

  const buckets: MetricBucket[] = [];
  for (const [, b] of bucketsMap) {
    const sorted = [...b.latencies].sort((a, c) => a - c);
    buckets.push({ ts: b.ts, requests: b.requests, errors: b.errors, latency_p50: pct(sorted, 50), latency_p95: pct(sorted, 95), latency_p99: pct(sorted, 99), total_cost: b.total_cost, input_tokens: b.input_tokens, output_tokens: b.output_tokens });
  }
  buckets.sort((a, c) => new Date(a.ts).getTime() - new Date(c.ts).getTime());

  const allLat: number[] = buckets.flatMap(b => b.latency_p50 !== null ? [b.latency_p50] : []);
  const rateLimitEvents = Array.from(logArr).filter(l => {
    if (!l || typeof l !== 'object') return false;
    const r = l as Record<string, unknown>;
    const sc = (r.status_code ?? r.status ?? (r.response as Record<string, unknown>)?.status_code) as number | undefined;
    return sc === 429;
  }).length;

  const top_errors = Array.from(errorMsgCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, c) => c.count - a.count)
    .slice(0, 5);

  return {
    buckets,
    totals: {
      requests: sum(buckets, b => b.requests),
      errors: sum(buckets, b => b.errors),
      latency_p50: pct(allLat, 50),
      latency_p95: pct(allLat, 95),
      latency_p99: pct(allLat, 99),
      total_cost: sum(buckets, b => b.total_cost),
      input_tokens: sum(buckets, b => b.input_tokens),
      output_tokens: sum(buckets, b => b.output_tokens),
      rate_limit_events: rateLimitEvents,
      top_errors,
    },
  };
}

function extractErrMsg(r: Record<string, unknown>): string | null {
  const candidates = [
    r.error, r.error_message, r.message,
    (r.error as Record<string, unknown>)?.message,
    (r.response as Record<string, unknown>)?.error,
    (r.response as Record<string, unknown>)?.error_message,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey();
    if (!apiKey) return NextResponse.json({ error: 'No Swarms API key found.' }, { status: 401, headers: { 'Cache-Control': NO_STORE } });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const cacheKey = user?.id ?? `_env_${apiKey.slice(-8)}`;
    const force = request.nextUrl.searchParams.get('refresh') === '1';
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (!force && cached && cached.expiresAt > now) return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT', 'Cache-Control': NO_STORE } });

    const { granularity, groupBy, from, to } = parseParams(request.nextUrl);
    const granSecs = GRANULARITY_SECS[granularity];
    const granMs = granSecs * 1000;
    let degraded = false;

    const dimCol = groupBy === 'none' ? null
      : groupBy === 'agent' ? 'agent_name'
      : groupBy === 'model' ? 'model'
      : groupBy === 'endpoint' ? 'endpoint'
      : 'swarm_type';

    let buckets: MetricBucket[] = [];
    let topMap = new Map<string, TopGroup>();

    if (user?.id) {
      const dbRes = await queryDb(user.id, from, to, granSecs, dimCol);
      if (dbRes) ({ buckets, topMap } = dbRes);
    }

    if (!buckets.length) {
      degraded = true;
      const fb = await fallbackMetrics(apiKey, from, to, granMs);
      buckets = fb.buckets;
      if (dimCol) topMap = new Map();
      const totals = fb.totals;
      const response: MetricsResponse = {
        buckets, totals,
        top_groups: Array.from(topMap.values()).sort((a, c) => c.requests - a.requests).slice(0, 10),
        degraded,
      };
      cache.set(cacheKey, { data: response, expiresAt: now + CACHE_TTL_MS });
      return NextResponse.json(response, { headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE } });
    }

    const allLat50 = buckets.flatMap(b => b.latency_p50 !== null ? [b.latency_p50] : []);
    const allLat95 = buckets.flatMap(b => b.latency_p95 !== null ? [b.latency_p95] : []);
    const allLat99 = buckets.flatMap(b => b.latency_p99 !== null ? [b.latency_p99] : []);
    const totals = {
      requests: sum(buckets, b => b.requests),
      errors: sum(buckets, b => b.errors),
      latency_p50: pct(allLat50, 50),
      latency_p95: pct(allLat95, 95),
      latency_p99: pct(allLat99, 99),
      total_cost: sum(buckets, b => b.total_cost),
      input_tokens: sum(buckets, b => b.input_tokens),
      output_tokens: sum(buckets, b => b.output_tokens),
      rate_limit_events: 0,
      top_errors: [],
    };

    const response: MetricsResponse = {
      buckets,
      totals,
      top_groups: Array.from(topMap.values()).sort((a, c) => c.requests - a.requests).slice(0, 10),
      degraded,
    };

    cache.set(cacheKey, { data: response, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(response, { headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE } });
  } catch (error) {
    return jsonErrorFromUnknown('api/observability/metrics', error);
  }
}
