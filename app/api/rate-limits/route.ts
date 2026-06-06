import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const NO_STORE = 'private, no-store';
const CACHE_TTL_MS = 20_000;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No Swarms API key found. Sign in or create one in your Swarms account.',
        },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const cacheKey = user?.id ?? `_env_${apiKey.slice(-8)}`;

    const force = request.nextUrl.searchParams.get('refresh') === '1';
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (!force && cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT', 'Cache-Control': NO_STORE },
      });
    }

    const client = new SwarmsAPIClient(apiKey);
    const data = await client.getRateLimits();

    cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/rate-limits', error);
  }
}
