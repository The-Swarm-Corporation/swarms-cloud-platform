import 'server-only';
import Stripe from 'stripe';

let cached: Stripe | null = null;

/**
 * Lazily construct the Stripe client from `STRIPE_SECRET_KEY`. Returns null when
 * the key is not configured so routes can respond with a clear "billing not
 * configured" error instead of throwing at import time.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (cached) return cached;
  cached = new Stripe(key);
  return cached;
}
