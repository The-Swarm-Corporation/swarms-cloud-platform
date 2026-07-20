'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';

export interface ApiKeyRow {
  id: string;
  name: string | null;
  /** Masked form, e.g. "sk-ab.....f9c2". The full key is only ever returned at creation. */
  key: string;
  created_at: string;
}

export interface CreatedApiKey {
  id: string;
  name: string | null;
  /** The full key - shown once, never retrievable again. */
  key: string;
  created_at: string;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return body?.error || fallback;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/api-keys');
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to fetch API keys'));
      }
      const data = await response.json();
      setKeys(data.keys ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(
    async (name: string): Promise<CreatedApiKey> => {
      const response = await apiFetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to create API key'));
      }
      const created: CreatedApiKey = await response.json();
      await fetchKeys();
      return created;
    },
    [fetchKeys],
  );

  const deleteKey = useCallback(
    async (id: string): Promise<void> => {
      const response = await apiFetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to revoke API key'));
      }
      await fetchKeys();
    },
    [fetchKeys],
  );

  return { keys, isLoading, error, refetch: fetchKeys, createKey, deleteKey };
}
