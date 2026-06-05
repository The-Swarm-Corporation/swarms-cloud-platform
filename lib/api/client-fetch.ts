'use client';

import { useUIStore } from '@/lib/store/ui-store';

/**
 * Browser fetch wrapper for our own `/api/*` routes. Attaches the user's
 * Swarms API key from the Zustand store as `x-api-key` so the server route
 * can call upstream without falling back to `process.env.SWARMS_API_KEY`.
 *
 * Use this everywhere a client component hits `/api/*`. Drop-in for `fetch`.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const apiKey = useUIStore.getState().swarmsApiKey;

  const headers = new Headers(init.headers);
  if (apiKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiKey);
  }

  return fetch(input, { ...init, headers });
}
