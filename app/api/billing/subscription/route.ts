import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/billing/stripe';
import { getAuthedUser } from '@/lib/billing/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { priceIdForPlan } from '@/lib/billing/plans';

export const runtime = 'nodejs';

/** Current subscription state for the signed-in user (synced by the webhook). */
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const configured =
    Boolean(getStripe()) &&
    Boolean(priceIdForPlan('pro') || priceIdForPlan('premium'));

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({
      configured: false,
      tier: null,
      plan: null,
      status: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });
  }

  const [{ data: userRow }, { data: sub }] = await Promise.all([
    admin.from('users').select('tier').eq('id', user.id).maybeSingle(),
    admin
      .from('subscriptions')
      .select('status, cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tier = (userRow?.tier as string | null) ?? null;
  const plan = tier === 'pro' || tier === 'premium' ? tier : null;

  return NextResponse.json({
    configured,
    tier,
    plan,
    status: sub?.status ?? null,
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    currentPeriodEnd: sub?.current_period_end ?? null,
  });
}
