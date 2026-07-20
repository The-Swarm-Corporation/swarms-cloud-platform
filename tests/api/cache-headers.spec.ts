import { test, expect } from '@playwright/test';

/**
 * Routes that wrap an upstream call in an in-memory cache emit X-Cache
 * headers we depend on in the UI. These tests confirm the headers are
 * present and shaped correctly. They require a valid SWARMS_API_KEY
 * because the cache is keyed per API key and a 401 short-circuits before
 * any cache header is set.
 *
 * In `next dev` HMR can re-evaluate route modules and drop the in-memory
 * cache map mid-test, so the strict "second request must be HIT" check
 * only runs against a production build (PLAYWRIGHT_USE_BUILD=1). In dev
 * we still verify the headers are emitted at all.
 */
const CACHED = [
  { path: '/api/models', maxAgeSeconds: 36_000 },
  { path: '/api/swarms', maxAgeSeconds: 36_000 },
  { path: '/api/credits', maxAgeSeconds: 86_400 },
  { path: '/api/logs', maxAgeSeconds: 30 },
  { path: '/api/rate-limits', maxAgeSeconds: 20 },
];

const STRICT = process.env.PLAYWRIGHT_USE_BUILD === '1';

// Run serially so the tests don't race each other's ?refresh=1 calls.
test.describe.configure({ mode: 'serial' });

test.describe('Cache header contract', () => {
  test.skip(
    !process.env.SWARMS_API_KEY,
    'SWARMS_API_KEY required - cache headers are only set after a successful upstream call.'
  );

  for (const { path, maxAgeSeconds } of CACHED) {
    test(`${path} emits X-Cache and X-Cache-Expires-In`, async ({
      request,
    }) => {
      const apiKey = process.env.SWARMS_API_KEY!;
      const headers = { 'x-api-key': apiKey };

      // Prime: force a fresh fetch and assert MISS.
      const primed = await request.get(`${path}?refresh=1`, { headers });
      expect(primed.ok()).toBe(true);
      expect(primed.headers()['x-cache']).toBe('MISS');

      // Follow-up: non-refresh request. In production we require HIT; in
      // `next dev` HMR can wipe the cache between calls, so we just
      // require the header to be present.
      const follow = await request.get(path, { headers });
      expect(follow.ok()).toBe(true);
      const followStatus = follow.headers()['x-cache'];
      expect(['HIT', 'MISS']).toContain(followStatus);
      if (STRICT) {
        expect(followStatus).toBe('HIT');
        const expiresIn = Number(follow.headers()['x-cache-expires-in']);
        expect(expiresIn).toBeGreaterThan(0);
        expect(expiresIn).toBeLessThanOrEqual(maxAgeSeconds);
      }

      // ?refresh=1 always bypasses the cache and returns MISS.
      const forced = await request.get(`${path}?refresh=1`, { headers });
      expect(forced.ok()).toBe(true);
      expect(forced.headers()['x-cache']).toBe('MISS');
    });
  }
});
