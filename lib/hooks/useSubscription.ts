'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';

export interface SubscriptionState {
  configured: boolean;
  tier: string | null;
  plan: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

export function isActiveStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/billing/subscription');
      if (res.status === 401) {
        setData(null);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load subscription');
      setData(json as SubscriptionState);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { data, isLoading, error, refetch: fetchSubscription };
}
