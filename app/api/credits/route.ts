import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import { CreditBalanceResponse } from '@/types/api';

// User-scoped data; never let a shared cache (or the browser, across sessions)
// hold it. The route's own in-memory cache below provides upstream throttling.
const NO_STORE = 'private, no-store';

const CACHE_TTL_MS = 90_000;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

// A brand-new account has no upstream credits record yet, so the Swarms API
// answers GET /v1/account/credits with 404 "user credits not found". That is a
// normal empty state, not a failure — represent it as a zero balance so the
// dashboard and settings render instead of erroring. Without this the credits
// hook (which re-polls every 30s) turns one missing record into a stream of
// console 404s for every new user. See issue #65.
const EMPTY_CREDIT_BALANCE: CreditBalanceResponse = {
  credit: 0,
  free_credit: 0,
  referral_credits: 0,
  total_credits: 0,
};

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

    const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
    let credits: CreditBalanceResponse;
    try {
      credits = await client.getCredits();
    } catch (error) {
      // Only a missing record (404) becomes an empty balance; genuine upstream
      // failures (401/429/5xx/network) still propagate to the catch below.
      if ((error as { status?: number } | null)?.status === 404) {
        credits = EMPTY_CREDIT_BALANCE;
      } else {
        throw error;
      }
    }

    cache.set(cacheKey, { data: credits, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(credits, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/credits', error);
  }
}
