import 'server-only';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { planForPriceId, type PlanId } from './plans';

/** Statuses that grant access to paid features. */
export function isEntitled(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

function toIso(unix: number | null | undefined): string | null {
  return typeof unix === 'number' ? new Date(unix * 1000).toISOString() : null;
}

/**
 * Sync a Stripe subscription into the app's data model:
 *   1. Upsert the row in `public.subscriptions` (matching the platform schema).
 *   2. Set the entitlement `users.tier` to the plan ('pro' | 'premium') while
 *      active/trialing, otherwise 'free'.
 *
 * The user is resolved from `subscription_data.metadata.supabase_user_id`, which
 * we set at Checkout, so this does not depend on a customers table.
 */
export async function applySubscription(
  admin: SupabaseClient,
  sub: Stripe.Subscription
): Promise<void> {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) {
    console.warn(
      `[billing] subscription ${sub.id} has no supabase_user_id metadata; skipping`
    );
    return;
  }

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const plan: PlanId | null = planForPriceId(priceId);
  const entitled = isEntitled(sub.status);

  // Entitlement first, so access is correct even if the row upsert has issues.
  if (plan && entitled) {
    await admin.from('users').update({ tier: plan }).eq('id', userId);
  } else if (!entitled) {
    await admin.from('users').update({ tier: 'free' }).eq('id', userId);
  }

  const row = {
    id: sub.id,
    user_id: userId,
    status: sub.status,
    metadata: sub.metadata ?? {},
    price_id: priceId,
    quantity: item?.quantity ?? null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    created: toIso(sub.created),
    current_period_start: toIso(item?.current_period_start),
    current_period_end: toIso(item?.current_period_end),
    ended_at: toIso(sub.ended_at),
    cancel_at: toIso(sub.cancel_at),
    canceled_at: toIso(sub.canceled_at),
    trial_start: toIso(sub.trial_start),
    trial_end: toIso(sub.trial_end),
    interval: item?.price?.recurring?.interval ?? null,
  };

  const { error } = await admin.from('subscriptions').upsert(row);
  // If the price isn't present in `prices` yet, the FK fails — persist the row
  // without the price reference so status/entitlement still sync.
  if (error && /foreign key|price_id|violates/i.test(error.message)) {
    await admin.from('subscriptions').upsert({ ...row, price_id: null });
  } else if (error) {
    console.error('[billing] failed to upsert subscription', error);
  }
}
