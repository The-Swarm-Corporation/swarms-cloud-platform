// Subscription plan catalog. Plan metadata (labels/features) is safe to import on
// the client; the Stripe price-id resolution reads server-only env vars and is
// only ever called from server routes.

export type PlanId = 'pro' | 'premium';

export interface PlanMeta {
  id: PlanId;
  label: string;
  blurb: string;
  /** Display price, e.g. "$19.99". Billing amounts are set by the Stripe price. */
  priceLabel: string;
  interval: string;
  features: string[];
  /** Name of the env var holding this plan's Stripe price id. */
  priceEnv: string;
}

export const PLANS: PlanMeta[] = [
  {
    id: 'pro',
    label: 'Pro',
    blurb: 'For individuals shipping real workloads.',
    priceLabel: '$19.99',
    interval: '/mo',
    priceEnv: 'STRIPE_PRICE_PRO',
    features: [
      'Higher rate limits',
      'Priority compute lane',
      'Premium endpoints, including the Workflow Builder',
    ],
  },
  {
    id: 'premium',
    label: 'Premium',
    blurb: 'For teams running at production scale.',
    priceLabel: '$99.99',
    interval: '/mo',
    priceEnv: 'STRIPE_PRICE_PREMIUM',
    features: [
      'Everything in Pro',
      'Highest rate limits',
      '24/7 priority support',
    ],
  },
];

export function getPlan(id: string | null | undefined): PlanMeta | undefined {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === id);
}

export function isPlanId(value: unknown): value is PlanId {
  return value === 'pro' || value === 'premium';
}

/** Server-only: the Stripe price id configured for a plan, or null if unset. */
export function priceIdForPlan(id: PlanId): string | null {
  const plan = getPlan(id);
  if (!plan) return null;
  return process.env[plan.priceEnv]?.trim() || null;
}

/** Server-only: map a Stripe price id back to our plan id. */
export function planForPriceId(
  priceId: string | null | undefined
): PlanId | null {
  if (!priceId) return null;
  for (const p of PLANS) {
    if (process.env[p.priceEnv]?.trim() === priceId) return p.id;
  }
  return null;
}
