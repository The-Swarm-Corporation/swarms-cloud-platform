import { useCallback, useEffect, useState } from 'react';
import { MetricsSummaryResponse } from '@/types/api';

export function useMetricsSummary() {
  const [summary, setSummary] = useState<MetricsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      const url = force ? '/api/metrics/summary?refresh=1' : '/api/metrics/summary';
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch metrics summary');
      }

      const data: MetricsSummaryResponse = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch metrics summary',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refetch = useCallback(() => {
    fetchSummary(true);
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch };
}
