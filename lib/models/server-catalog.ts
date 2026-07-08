// Server-side only — import from server components, route handlers, or
// sitemap/metadata code. Never import into client components: it reads
// process.env.SWARMS_API_KEY.
import {
  flattenModels,
  POPULAR_MODEL_IDS,
  type ModelEntry,
} from '@/lib/models/catalog';

export { POPULAR_MODEL_IDS };

const CACHE_TTL_MS = 10 * 60 * 60 * 1000; // match /api/models cache

let cached: { entries: ModelEntry[]; expiresAt: number } | null = null;

/**
 * Fetch the model catalog server-side using the system API key only.
 * Never touches cookies/auth so callers stay statically renderable.
 * Returns [] when no key is configured or the upstream call fails.
 */
export async function getServerCatalog(): Promise<ModelEntry[]> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.entries;

  const apiKey = process.env.SWARMS_API_KEY;
  if (!apiKey) return [];

  const baseURL = process.env.SWARMS_API_BASE_URL || 'https://api.swarms.world';

  try {
    const res = await fetch(`${baseURL}/v1/models/available`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 36000 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: unknown };
    const entries = flattenModels(data?.models ?? data);
    cached = { entries, expiresAt: now + CACHE_TTL_MS };
    return entries;
  } catch {
    return [];
  }
}

/**
 * Model ids for the sitemap / static params: live catalog when available,
 * otherwise the curated popular list. Deduped, capped to keep sitemaps sane.
 */
export async function getSitemapModelIds(limit = 1000): Promise<string[]> {
  const entries = await getServerCatalog();
  const ids = entries
    .map((e) => e.id)
    .filter((id) => /^[\w.\-/:]+$/.test(id) && id.length <= 100);
  const merged = Array.from(new Set([...POPULAR_MODEL_IDS, ...ids]));
  return merged.slice(0, limit);
}
