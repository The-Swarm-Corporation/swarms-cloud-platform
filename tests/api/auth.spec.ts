import { test, expect } from '@playwright/test';

/**
 * Every proxied /api/* route should refuse to call upstream without an
 * API key. We send no x-api-key header and rely on the test process not
 * having SWARMS_API_KEY in env - if it does, these still pass against
 * routes that gate on header first, but the validation tests below cover
 * the rest.
 */
const PROTECTED_GETS = [
  '/api/agents/list',
  '/api/credits',
  '/api/logs',
  '/api/models',
  '/api/rate-limits',
  '/api/swarms',
];

const PROTECTED_POSTS: { path: string; body: unknown }[] = [
  { path: '/api/agents', body: {} },
  { path: '/api/swarm', body: {} },
  { path: '/api/prompt-generator', body: {} },
];

test.describe('API auth gate', () => {
  test.skip(
    !!process.env.SWARMS_API_KEY,
    'SWARMS_API_KEY is set in env; the route will fall through to upstream and these tests do not apply.'
  );

  for (const path of PROTECTED_GETS) {
    test(`GET ${path} without x-api-key returns 401`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/api[_ ]?key/i);
    });
  }

  for (const { path, body } of PROTECTED_POSTS) {
    test(`POST ${path} without x-api-key returns 401`, async ({ request }) => {
      const res = await request.post(path, { data: body });
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/api[_ ]?key/i);
    });
  }
});
