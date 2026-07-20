'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSubscription, isActiveStatus } from '@/lib/hooks/useSubscription';
import { PLANS, getPlan, type PlanId } from '@/lib/billing/plans';
import { useUIStore } from '@/lib/store/ui-store';
import { apiFetch } from '@/lib/api/client-fetch';
import { Modal } from '@/components/ui/Modal';
import { BillingHistory } from '@/components/settings/BillingHistory';
import {
  Crown,
  Check,
  Loader2,
  ArrowRight,
  CircleAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BillingSection() {
  const { data, isLoading, refetch } = useSubscription();
  const addToast = useUIStore((s) => s.addToast);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Reconcile straight from Stripe (does not depend on the webhook), then
  // refresh the displayed status.
  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await apiFetch('/api/billing/sync', { method: 'POST' });
    } catch {
      // ignore - refetch still reflects the last known state
    }
    await refetch();
    setSyncing(false);
  }, [refetch]);

  // Surface the result of a returning Stripe Checkout redirect, then clean the
  // URL so a refresh doesn't re-trigger it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (!checkout) return;

    // Clean the query first so a refresh doesn't replay this.
    params.delete('checkout');
    const qs = params.toString();
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (qs ? `?${qs}` : '')
    );

    if (checkout === 'success') {
      setSuccessOpen(true);
      // Reconcile from Stripe directly so the plan reflects immediately, even if
      // the webhook is delayed or misconfigured. Retry briefly for consistency.
      let cancelled = false;
      (async () => {
        for (let i = 0; i < 3 && !cancelled; i++) {
          await syncNow();
          await new Promise((r) => setTimeout(r, 1500));
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (checkout === 'cancel') {
      addToast({ type: 'info', message: 'Checkout canceled.', duration: 3000 });
    }
  }, [addToast, syncNow]);

  // `tier` is the entitlement source of truth. Treat the user as subscribed if
  // the tier is a paid plan even when the subscription row is missing/lagging.
  const currentPlan = (data?.plan as PlanId | null) ?? null;
  const active = isActiveStatus(data?.status) || Boolean(currentPlan);

  const upgrade = async (plan: PlanId) => {
    setBusyPlan(plan);
    try {
      const res = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || 'Could not start checkout.');
      }
      window.location.href = json.url as string;
    } catch (e) {
      addToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not start checkout.',
        duration: 5000,
      });
      setBusyPlan(null);
    }
  };

  const setCancel = async (resume: boolean) => {
    setCanceling(true);
    try {
      const res = await apiFetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Could not update subscription.');
      addToast({
        type: 'success',
        message: resume
          ? 'Your membership will continue.'
          : 'Your membership will cancel at the end of the period.',
        duration: 4000,
      });
      refetch();
    } catch (e) {
      addToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not update subscription.',
        duration: 5000,
      });
    } finally {
      setCanceling(false);
    }
  };

  const currentPlanMeta = getPlan(currentPlan);

  return (
    <section className="mb-6 rounded-lg border border-border bg-card">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
        <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 mt-0.5">
          <Crown className="w-3.5 h-3.5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Subscription
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upgrade for higher limits and premium features. Cancel anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
          aria-label="Refresh subscription status"
          title="Refresh from Stripe"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="p-5 space-y-4">
        {data && !data.configured && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 flex items-start gap-2 text-xs text-warning">
            <CircleAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Billing is not configured on this deployment yet. Set your Stripe
              keys and price IDs to enable upgrades.
            </span>
          </div>
        )}

        {/* Current status banner */}
        {active && currentPlanMeta && (
          <div className="rounded-md border border-border bg-subtle px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {currentPlanMeta.label} plan
                </span>
                <span className="inline-flex items-center px-1.5 h-5 rounded-sm border border-success/40 bg-success/10 text-[10px] font-medium uppercase tracking-wider text-success">
                  Active
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {data?.cancelAtPeriodEnd
                  ? `Cancels on ${formatDate(data.currentPeriodEnd)}`
                  : data?.currentPeriodEnd
                  ? `Renews on ${formatDate(data.currentPeriodEnd)}`
                  : 'Your membership is active.'}
              </div>
            </div>
            {data?.cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={() => setCancel(true)}
                disabled={canceling}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {canceling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Resume membership
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCancel(false)}
                disabled={canceling}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {canceling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Cancel membership
              </button>
            )}
          </div>
        )}

        {/* Plan cards */}
        {isLoading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-40 rounded-lg border border-border bg-subtle animate-pulse" />
            <div className="h-40 rounded-lg border border-border bg-subtle animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border p-4 flex flex-col gap-3 ${
                    isCurrent
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-border bg-subtle/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {plan.label}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center px-1.5 h-4 rounded-sm bg-accent/10 border border-accent/30 text-[10px] font-medium uppercase tracking-wider text-accent">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                        {plan.priceLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plan.interval}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.blurb}
                    </p>
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-foreground/90"
                      >
                        <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-border bg-card text-muted-foreground text-sm font-medium cursor-default"
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => upgrade(plan.id)}
                      disabled={busyPlan !== null}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {busyPlan === plan.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          {active ? 'Switch to' : 'Upgrade to'} {plan.label}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <BillingHistory />
      </div>

      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)}>
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {getPlan(data?.plan)
              ? `You're on ${getPlan(data?.plan)!.label}!`
              : 'Subscription activated'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            {getPlan(data?.plan)
              ? 'Your membership is active. Enjoy higher limits, priority compute, and premium features.'
              : 'Payment received. Your plan is being activated - this can take a few seconds.'}
          </p>
          <button
            type="button"
            onClick={() => setSuccessOpen(false)}
            className="mt-5 inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </Modal>
    </section>
  );
}
