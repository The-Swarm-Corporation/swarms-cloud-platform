import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

// User-scoped data; never let a shared cache (or the browser, across sessions)
// hold it. The route's own in-memory cache below provides upstream throttling.
const NO_STORE = 'private, no-store';

const CACHE_TTL_MS = 30_000;

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

    let cacheKey = `_env_${apiKey.slice(-8)}`;
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) cacheKey = user.id;
    }

    const force = request.nextUrl.searchParams.get('refresh') === '1';
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (!force && cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT', 'Cache-Control': NO_STORE },
      });
    }

    const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
    const credits = await client.getCredits();

    cache.set(cacheKey, { data: credits, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(credits, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/credits', error);
  }
}
