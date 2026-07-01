'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client-fetch';

export interface SubscriptionRow {
  id: string;
  plan: string;
  status: string;
  amount: number | null;
  currency: string;
  interval: string | null;
  created: number;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  created: number;
  number: string | null;
  url: string | null;
  description: string | null;
}

interface BillingHistory {
  configured: boolean;
  subscriptions: SubscriptionRow[];
  payments: PaymentRow[];
}

export function useBillingHistory() {
  const [data, setData] = useState<BillingHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/billing/history');
      if (res.status === 401) {
        setData(null);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load billing history');
      setData(json as BillingHistory);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, isLoading, error, refetch: fetchHistory };
}
