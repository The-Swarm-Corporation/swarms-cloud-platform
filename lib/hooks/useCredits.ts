import { useCallback, useEffect, useRef, useState } from 'react';
import { CreditBalanceResponse } from '@/types/api';

const REFRESH_INTERVAL = 30_000; // 30 seconds

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCredits = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      const url = force ? '/api/credits?refresh=1' : '/api/credits';
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch credit balance');
      }

      const data: CreditBalanceResponse = await response.json();
      setCredits(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credit balance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    intervalRef.current = setInterval(() => {
      fetchCredits();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchCredits]);

  const refetch = useCallback(() => {
    fetchCredits(true);
  }, [fetchCredits]);

  return { credits, isLoading, error, refetch };
}
