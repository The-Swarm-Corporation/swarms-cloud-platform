import { NextRequest, NextResponse } from 'next/server';
import { SwarmsAPIClient } from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const NO_STORE = 'private, no-store';
const CACHE_TTL_MS = 60_000;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
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

  try {
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

    const client = new SwarmsAPIClient(
      apiKey,
      process.env.SWARMS_API_BASE_URL,
    );

    const configs = await client.listAgentConfigs();

    cache.set(cacheKey, { data: configs, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(configs, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/agents/list', error);
  }
}
