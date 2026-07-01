import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/billing/stripe';
import { getAuthedUser } from '@/lib/billing/auth';
import { planForPriceId, getPlan } from '@/lib/billing/plans';

export const runtime = 'nodejs';

/**
 * The signed-in user's subscriptions and payments (invoices) from Stripe,
 * matched by customer email. Used to render the billing history tables.
 */
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe || !user.email) {
    return NextResponse.json({ configured: Boolean(stripe), subscriptions: [], payments: [] });
  }

  try {
    const customers = await stripe.customers.list({ email: user.email, limit: 5 });

    const subscriptions: unknown[] = [];
    const payments: unknown[] = [];

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 100,
      });
      for (const s of subs.data) {
        const item = s.items.data[0];
        const plan = planForPriceId(item?.price?.id);
        subscriptions.push({
          id: s.id,
          plan: plan ? getPlan(plan)?.label ?? plan : item?.price?.nickname ?? 'Subscription',
          status: s.status,
          amount: item?.price?.unit_amount ?? null,
          currency: (item?.price?.currency ?? 'usd').toUpperCase(),
          interval: item?.price?.recurring?.interval ?? null,
          created: s.created,
          cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
        });
      }

      const invoices = await stripe.invoices.list({ customer: customer.id, limit: 100 });
      for (const inv of invoices.data) {
        payments.push({
          id: inv.id,
          amount: inv.amount_paid ?? inv.amount_due ?? 0,
          currency: (inv.currency ?? 'usd').toUpperCase(),
          status: inv.status,
          created: inv.created,
          number: inv.number ?? null,
          url: inv.hosted_invoice_url ?? null,
          description: inv.lines?.data?.[0]?.description ?? null,
        });
      }
    }

    subscriptions.sort((a, b) => (b as { created: number }).created - (a as { created: number }).created);
    payments.sort((a, b) => (b as { created: number }).created - (a as { created: number }).created);

    return NextResponse.json({ configured: true, subscriptions, payments });
  } catch (error) {
    console.error('[api/billing/history]', error);
    return NextResponse.json({ error: 'Could not load billing history.' }, { status: 500 });
  }
}
