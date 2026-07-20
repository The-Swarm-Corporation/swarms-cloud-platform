import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const NO_STORE = 'private, no-store';
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

// Logs only append with now() timestamps, so a period that has fully elapsed
// is immutable - cache it much longer than the still-accumulating current one.
const CACHE_TTL_CURRENT_MS = 60_000;
const CACHE_TTL_PAST_MS = 60 * 60_000;
const MAX_CACHE_ENTRIES = 200;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheSet(key: string, entry: CacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

interface LogUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  total_cost?: number;
}

interface LogData {
  name?: string;
  usage?: LogUsage;
}

export interface TokenUsageLog {
  timestamp: string;
  keyId: string;
  agent: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

// Run names carry a per-run suffix ("My-Agent-20260704_083651"); strip it so
// group-by-agent buckets runs of the same agent together.
function agentName(raw: string | undefined): string {
  if (!raw) return 'Unknown';
  return raw.replace(/-\d{8}_\d{6}$/, '');
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You are not signed in or your session has expired.' },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const start = request.nextUrl.searchParams.get('start');
    const end = request.nextUrl.searchParams.get('end');
    if (
      !start ||
      !end ||
      Number.isNaN(Date.parse(start)) ||
      Number.isNaN(Date.parse(end))
    ) {
      return NextResponse.json(
        { error: 'Provide valid start and end ISO timestamps.' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const cacheKey = `${user.id}:${start}:${end}`;
    const force = request.nextUrl.searchParams.get('refresh') === '1';
    const cached = cache.get(cacheKey);
    if (!force && cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT', 'Cache-Control': NO_STORE },
      });
    }

    // `is_deleted` is nullable with default false; filter "not true" so both
    // false and legacy NULL rows are kept (see lib/api/server-api-key.ts).
    const { data: keyRows, error: keysError } = await admin
      .from('swarms_cloud_api_keys')
      .select('id, name, key')
      .eq('user_id', user.id)
      .not('is_deleted', 'is', true)
      .order('created_at', { ascending: false });

    if (keysError) throw keysError;

    const keys = (keyRows ?? []).filter((row) => row.key);
    if (keys.length === 0) {
      const empty = { logs: [], keys: [], truncated: false };
      // Short TTL regardless of period: the user may create a key any moment.
      cacheSet(cacheKey, { data: empty, expiresAt: Date.now() + CACHE_TTL_CURRENT_MS });
      return NextResponse.json(empty, {
        headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
      });
    }

    const keyToId = new Map<string, string>(
      keys.map((row) => [row.key as string, String(row.id)]),
    );

    const logs: TokenUsageLog[] = [];
    let truncated = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const { data: rows, error } = await admin
        .from('swarms_api_logs')
        .select('created_at, api_key, data')
        .eq('category', 'completion')
        .in(
          'api_key',
          keys.map((row) => row.key as string),
        )
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        const data = (row.data ?? {}) as LogData;
        const usage = data.usage ?? {};
        logs.push({
          timestamp: row.created_at,
          keyId: keyToId.get(row.api_key as string) ?? 'unknown',
          agent: agentName(data.name),
          inputTokens: toNumber(usage.input_tokens),
          outputTokens: toNumber(usage.output_tokens),
          totalTokens: toNumber(usage.total_tokens),
          cost: toNumber(usage.total_cost),
        });
      }

      if (rows.length < PAGE_SIZE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }

    const payload = {
      logs,
      keys: keys.map((row) => ({
        id: String(row.id),
        name: row.name || 'Unnamed key',
      })),
      truncated,
    };

    const periodIsPast = Date.parse(end) <= Date.now();
    cacheSet(cacheKey, {
      data: payload,
      expiresAt:
        Date.now() + (periodIsPast ? CACHE_TTL_PAST_MS : CACHE_TTL_CURRENT_MS),
    });

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/token-usage', error);
  }
}
