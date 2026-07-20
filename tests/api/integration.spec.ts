import { test, expect } from '@playwright/test';

/**
 * Live integration tests that go through Next.js → Swarms API. Only run
 * when SWARMS_API_KEY is set to keep the suite from burning credits or
 * failing for contributors without a key. These intentionally avoid the
 * paid endpoints (no /api/agents POST, no /api/swarm POST,
 * no /api/prompt-generator POST).
 */
test.describe('Live upstream - read endpoints', () => {
  test.skip(
    !process.env.SWARMS_API_KEY,
    'SWARMS_API_KEY required for live upstream tests.'
  );

  const headers = () => ({ 'x-api-key': process.env.SWARMS_API_KEY! });

  test('GET /api/swarms returns available swarm types', async ({ request }) => {
    const res = await request.get('/api/swarms', { headers: headers() });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.swarm_types)).toBe(true);
    expect(body.swarm_types.length).toBeGreaterThan(0);
    // Sanity-check a well-known type
    expect(body.swarm_types).toContain('SequentialWorkflow');
  });

  test('GET /api/models returns models', async ({ request }) => {
    const res = await request.get('/api/models', { headers: headers() });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // The payload shape is loose - just confirm it's an object/array
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
  });

  test('GET /api/rate-limits returns a rate-limit envelope', async ({
    request,
  }) => {
    const res = await request.get('/api/rate-limits', { headers: headers() });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.rate_limits).toBeDefined();
    expect(body.rate_limits.minute).toBeDefined();
  });

  test('GET /api/credits returns a credit balance', async ({ request }) => {
    const res = await request.get('/api/credits', { headers: headers() });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.total_credits).toBe('number');
    expect(typeof body.credit).toBe('number');
  });

  test('GET /api/agents/list returns an array', async ({ request }) => {
    const res = await request.get('/api/agents/list', { headers: headers() });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // Backend returns either an array directly or a wrapper; both are valid
    if (Array.isArray(body)) {
      expect(body).toBeInstanceOf(Array);
    } else {
      expect(typeof body).toBe('object');
    }
  });
});
