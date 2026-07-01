import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { applySubscription } from '@/lib/billing/service';

export const runtime = 'nodejs';

/**
 * Stripe webhook. Verifies the signature against `STRIPE_WEBHOOK_SECRET`, then
 * syncs subscription lifecycle events into the user's row. Must read the raw
 * request body for signature verification.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const admin = createAdminClient();

  if (!stripe || !secret || !admin) {
    return NextResponse.json(
      { error: 'Billing webhook is not configured.' },
      { status: 503 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error('[api/billing/webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(admin, sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // On deletion the subscription arrives with status 'canceled', so the
        // same sync path resets the tier to 'free'.
        await applySubscription(admin, event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (error) {
    console.error(`[api/billing/webhook] handler error for ${event.type}`, error);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
