import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
const TEN_HOURS_SECONDS = 10 * 60 * 60;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * Whether an upstream failure is worth one retry. Covers 5xx/network errors
 * and the key-verification service's transient hiccup, which surfaces as a
 * 403 whose message says "unexpected error ... try again" — distinct from a
 * definitive invalid/expired-key rejection.
 */
function isTransientUpstreamError(error: unknown): boolean {
  const e = error as { status?: number; message?: string } | null;
  const status = e?.status;
  if (status === undefined || status === 0 || status >= 500) return true;
  if (status === 403 && /unexpected error|try again/i.test(e?.message ?? '')) {
    return true;
  }
  return false;
}

async function fetchModelsWithRetry(client: SwarmsAPIClient) {
  try {
    return await client.getAvailableModels();
  } catch (error) {
    if (!isTransientUpstreamError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return client.getAvailableModels();
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Swarms API key found. Sign in or create one in your Swarms account.' },
        { status: 401 }
      );
    }

    const force = request.nextUrl.searchParams.get('refresh') === '1';
    const cacheKey = apiKey;
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (!force && cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Expires-In': String(
            Math.max(0, Math.floor((cached.expiresAt - now) / 1000))
          ),
          'Cache-Control': `public, max-age=${TEN_HOURS_SECONDS}`,
        },
      });
    }

    const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
    const data = await fetchModelsWithRetry(client);

    cache.set(cacheKey, { data, expiresAt: now + TEN_HOURS_MS });

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Expires-In': String(TEN_HOURS_SECONDS),
        'Cache-Control': `public, max-age=${TEN_HOURS_SECONDS}`,
      },
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/models', error);
  }
}
