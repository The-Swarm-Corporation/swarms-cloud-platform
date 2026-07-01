import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/billing/stripe';
import { getAuthedUser } from '@/lib/billing/auth';
import { isPlanId, priceIdForPlan } from '@/lib/billing/plans';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json(
      { error: 'You must be signed in to upgrade.' },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let body: { plan?: string };
  try {
    body = (await request.json()) as { plan?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  if (!isPlanId(body.plan)) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }

  const priceId = priceIdForPlan(body.plan);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price is configured for the ${body.plan} plan.` },
      { status: 503 }
    );
  }

  try {
    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      // Persisted on the subscription so the webhook can map it back to the user.
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: body.plan },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[api/billing/checkout]', error);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 }
    );
  }
}
