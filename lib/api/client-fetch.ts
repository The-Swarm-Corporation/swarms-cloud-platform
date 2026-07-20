'use client';

/**
 * Browser fetch wrapper for our own `/api/*` routes. Defaults to
 * `cache: 'no-store'` so the browser never serves a previously cached response
 * across sessions (which would leak per-user data - credits, rate limits,
 * agent lists - to whoever signs in next).
 *
 * Callers that explicitly want HTTP caching (catalog endpoints like
 * `/api/models` or `/api/swarms`) can override by passing `cache: 'default'`
 * in `init`.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, { cache: 'no-store', ...init });
}
