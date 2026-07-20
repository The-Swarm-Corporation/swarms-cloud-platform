import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/billing/stripe';
import { getAuthedUser } from '@/lib/billing/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Cancel the user's subscription at the end of the current billing period, or
 * resume a subscription that was set to cancel. The webhook keeps the user's
 * row in sync, but we also update `cancel_at_period_end` here for immediacy.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let resume = false;
  try {
    const body = (await request.json().catch(() => ({}))) as { resume?: boolean };
    resume = Boolean(body?.resume);
  } catch {
    // no body - treat as cancel
  }

  const { data } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subId = data?.id as string | undefined;
  if (!subId) {
    return NextResponse.json(
      { error: 'No active subscription to modify.' },
      { status: 400 }
    );
  }

  try {
    // Update Stripe; the webhook syncs `subscriptions` + `users.tier`. We also
    // write the flag here so the UI reflects it immediately.
    await stripe.subscriptions.update(subId, {
      cancel_at_period_end: !resume,
    });

    await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: !resume })
      .eq('id', subId);

    return NextResponse.json({ ok: true, cancelAtPeriodEnd: !resume });
  } catch (error) {
    console.error('[api/billing/cancel]', error);
    return NextResponse.json(
      { error: 'Could not update your subscription. Please try again.' },
      { status: 500 }
    );
  }
}
