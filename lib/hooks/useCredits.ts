import { useCallback, useEffect, useState } from 'react';
import { CreditBalanceResponse } from '@/types/api';

const REFRESH_INTERVAL = 60_000; // 60 seconds

interface CreditsCache {
  data: CreditBalanceResponse | null;
  timestamp: number;
  error: string | null;
}

let creditsCache: CreditsCache = {
  data: null,
  timestamp: 0,
  error: null,
};

let fetchPromise: Promise<CreditBalanceResponse | null> | null = null;
let activeInstances = 0;
let intervalId: NodeJS.Timeout | null = null;

const fetchCreditsFromAPI = async (): Promise<CreditBalanceResponse | null> => {
  const response = await fetch('/api/credits', { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch credit balance');
  }
  return response.json();
};

const updateCache = async (force = false): Promise<void> => {
  const now = Date.now();
  if (!force && creditsCache.data && now - creditsCache.timestamp < REFRESH_INTERVAL) {
    return;
  }

  if (fetchPromise) {
    try {
      const data = await fetchPromise;
      if (data) {
        creditsCache = { data, timestamp: Date.now(), error: null };
      }
    } catch (error) {
      creditsCache.error =
        error instanceof Error ? error.message : 'Failed to fetch credit balance';
    }
    return;
  }

  fetchPromise = fetchCreditsFromAPI();
  try {
    const data = await fetchPromise;
    if (data) {
      creditsCache = { data, timestamp: Date.now(), error: null };
    }
  } catch (error) {
    creditsCache.error =
      error instanceof Error ? error.message : 'Failed to fetch credit balance';
  } finally {
    fetchPromise = null;
  }
};

const startSharedInterval = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    updateCache();
  }, REFRESH_INTERVAL);
};

const stopSharedInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalanceResponse | null>(
    creditsCache.data,
  );
  const [isLoading, setIsLoading] = useState(!creditsCache.data);
  const [error, setError] = useState<string | null>(creditsCache.error);

  const syncState = useCallback(() => {
    setCredits(creditsCache.data);
    setError(creditsCache.error);
    setIsLoading(false);
  }, []);

  const fetchCredits = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    await updateCache(force);
    syncState();
  }, [syncState]);

  useEffect(() => {
    activeInstances += 1;
    fetchCredits();
    startSharedInterval();

    return () => {
      activeInstances -= 1;
      if (activeInstances <= 0) {
        stopSharedInterval();
      }
    };
  }, [fetchCredits]);

  const refetch = useCallback(() => {
    fetchCredits(true);
  }, [fetchCredits]);

  return { credits, isLoading, error, refetch };
}
