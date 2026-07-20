import { test, expect } from '@playwright/test';

/**
 * Validate that /api/* routes reject malformed input BEFORE calling
 * upstream. We pass a stub x-api-key so the auth gate lets us through,
 * then assert the route returns 4xx without ever hitting the real API.
 */
const STUB_KEY = 'test-key-not-real';

test.describe('API input validation', () => {
  test('POST /api/agents with empty body returns 400', async ({ request }) => {
    const res = await request.post('/api/agents', {
      headers: { 'x-api-key': STUB_KEY, 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/agent_config|task|required/i);
  });

  test('POST /api/agents with task but no agent_config returns 400', async ({
    request,
  }) => {
    const res = await request.post('/api/agents', {
      headers: { 'x-api-key': STUB_KEY, 'Content-Type': 'application/json' },
      data: { task: 'do something' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/agents with non-JSON body returns 400', async ({
    request,
  }) => {
    const res = await request.post('/api/agents', {
      headers: { 'x-api-key': STUB_KEY, 'Content-Type': 'application/json' },
      data: 'not json' as unknown as object,
    });
    // Either the JSON parser hits an error (400) or the body is the
    // string-coerced version - both are explicit failures, not 500.
    expect([400, 422]).toContain(res.status());
  });

  test('POST /api/prompt-generator without goal returns 400', async ({
    request,
  }) => {
    const res = await request.post('/api/prompt-generator', {
      headers: { 'x-api-key': STUB_KEY, 'Content-Type': 'application/json' },
      data: { domain: 'health' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/goal|required/i);
  });

  test('POST /api/prompt-generator with empty goal returns 400', async ({
    request,
  }) => {
    const res = await request.post('/api/prompt-generator', {
      headers: { 'x-api-key': STUB_KEY, 'Content-Type': 'application/json' },
      data: { goal: '   ' },
    });
    expect(res.status()).toBe(400);
  });
});
