import { useState, useEffect, useCallback } from 'react';
import { RateLimitsResponse } from '@/types/api';
import { useUIStore } from '@/lib/store/ui-store';

interface RateLimitsCache {
  data: RateLimitsResponse | null;
  timestamp: number;
  error: string | null;
}

let rateLimitsCache: RateLimitsCache = {
  data: null,
  timestamp: 0,
  error: null,
};

const CACHE_DURATION = 60_000;
let fetchPromise: Promise<RateLimitsResponse | null> | null = null;
let activeInstances = 0;
let intervalId: NodeJS.Timeout | null = null;
const listeners = new Set<() => void>();

const fetchRateLimitsFromAPI = async (): Promise<RateLimitsResponse | null> => {
  const response = await fetch('/api/rate-limits', { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch rate limits');
  }
  return response.json();
};

const updateCache = async (force = false): Promise<void> => {
  const now = Date.now();
  if (!force && rateLimitsCache.data && now - rateLimitsCache.timestamp < CACHE_DURATION) {
    return;
  }

  if (fetchPromise) {
    try {
      const data = await fetchPromise;
      if (data) {
        rateLimitsCache = { data, timestamp: Date.now(), error: null };
      }
    } catch (error) {
      rateLimitsCache.error =
        error instanceof Error ? error.message : 'Failed to fetch rate limits';
    }
    return;
  }

  fetchPromise = fetchRateLimitsFromAPI();
  try {
    const data = await fetchPromise;
    if (data) {
      rateLimitsCache = { data, timestamp: Date.now(), error: null };
    }
  } catch (error) {
    rateLimitsCache.error =
      error instanceof Error ? error.message : 'Failed to fetch rate limits';
  } finally {
    fetchPromise = null;
  }
};

const notifyListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
};

const startSharedInterval = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    updateCache().then(notifyListeners);
  }, CACHE_DURATION);
};

const stopSharedInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export function useRateLimits() {
  const [rateLimits, setRateLimits] = useState<RateLimitsResponse | null>(
    rateLimitsCache.data,
  );
  const [isLoading, setIsLoading] = useState(!rateLimitsCache.data);
  const [error, setError] = useState<string | null>(rateLimitsCache.error);

  const getAddToast = () => useUIStore.getState().addToast;

  const syncState = useCallback(() => {
    setRateLimits(rateLimitsCache.data);
    setError(rateLimitsCache.error);
    setIsLoading(false);
  }, []);

  const fetchRateLimits = useCallback(async (showErrorToast = false) => {
    setIsLoading(true);
    setError(null);
    await updateCache();
    syncState();

    if (rateLimitsCache.error && showErrorToast) {
      getAddToast()({
        type: 'error',
        message: rateLimitsCache.error,
        duration: 5000,
      });
    }
  }, [syncState]);

  useEffect(() => {
    activeInstances += 1;
    fetchRateLimits(true);
    startSharedInterval();

    const listener = () => syncState();
    listeners.add(listener);

    return () => {
      activeInstances -= 1;
      listeners.delete(listener);
      if (activeInstances <= 0) {
        stopSharedInterval();
      }
    };
  }, [fetchRateLimits, syncState]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    rateLimitsCache.timestamp = 0;
    await updateCache(true);
    syncState();

    if (rateLimitsCache.error) {
      getAddToast()({
        type: 'error',
        message: rateLimitsCache.error,
        duration: 5000,
      });
    }
  }, [syncState]);

  return {
    rateLimits,
    isLoading,
    error,
    refetch,
  };
}
