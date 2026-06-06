import { useState, useEffect, useRef } from 'react';
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

const CACHE_DURATION = 20_000;
let fetchPromise: Promise<RateLimitsResponse | null> | null = null;

const fetchRateLimitsFromAPI = async (): Promise<RateLimitsResponse | null> => {
  const response = await fetch('/api/rate-limits', { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch rate limits');
  }
  return response.json();
};

const updateCache = async (): Promise<void> => {
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

export function useRateLimits() {
  const [rateLimits, setRateLimits] = useState<RateLimitsResponse | null>(
    rateLimitsCache.data,
  );
  const [isLoading, setIsLoading] = useState(!rateLimitsCache.data);
  const [error, setError] = useState<string | null>(rateLimitsCache.error);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const getAddToast = () => useUIStore.getState().addToast;

  const fetchRateLimits = async (showErrorToast = false) => {
    const now = Date.now();
    const cacheAge = now - rateLimitsCache.timestamp;

    if (rateLimitsCache.data && cacheAge < CACHE_DURATION) {
      setRateLimits(rateLimitsCache.data);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (isInitialMount.current || cacheAge >= CACHE_DURATION) {
      setIsLoading(isInitialMount.current);
      setError(null);

      await updateCache();

      setRateLimits(rateLimitsCache.data);
      setError(rateLimitsCache.error);

      if (rateLimitsCache.error && showErrorToast) {
        getAddToast()({
          type: 'error',
          message: rateLimitsCache.error,
          duration: 5000,
        });
      }

      setIsLoading(false);
      isInitialMount.current = false;
    }
  };

  useEffect(() => {
    fetchRateLimits(true);

    intervalRef.current = setInterval(() => {
      fetchRateLimits(false);
    }, CACHE_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    rateLimitsCache.timestamp = 0;
    await updateCache();
    setRateLimits(rateLimitsCache.data);
    setError(rateLimitsCache.error);

    if (rateLimitsCache.error) {
      getAddToast()({
        type: 'error',
        message: rateLimitsCache.error,
        duration: 5000,
      });
    }

    setIsLoading(false);
  };

  return {
    rateLimits,
    isLoading,
    error,
    refetch,
  };
}
