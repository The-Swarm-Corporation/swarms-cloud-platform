# Stripe Setup — Pro / Premium Subscriptions

This app upgrades users to **Pro ($19.99/mo)** or **Premium ($99.99/mo)** with
Stripe Checkout from the account page (`/settings`), and lets them cancel or
resume. Entitlement is stored in `public.users.tier` (`pro` | `premium` |
`free`) and subscription state is written to `public.subscriptions`.

Do the following once to turn it on.

---

## Plans in this Stripe account

Account: `acct_1NuwUHEPcPpjnMfB` · [Dashboard](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB)

| Plan | Price | Product | Product link | Price ID |
| ---- | ----- | ------- | ------------ | -------- |
| Pro | $19.99/mo | `prod_TRqCgSiGyO8Os7` | [Open](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/products/prod_TRqCgSiGyO8Os7) | `price_1SUwVnEPcPpjnMfBiYo33hHc` |
| Premium | $99.99/mo | `prod_SHzzCFXw488bQP` | [Open](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/products/prod_SHzzCFXw488bQP) | `price_1RNPzsEPcPpjnMfBuURmt3Bi` |

These price IDs are already set in `.env.local` (`STRIPE_PRICE_PRO` /
`STRIPE_PRICE_PREMIUM`). They are **live-mode** IDs, so use a live secret key.

Useful dashboard links (account-scoped):

- [Products](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/products)
- [API keys](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/apikeys)
- [Webhooks](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/webhooks)

---

## 1. Create the products and prices

> Already done for this account — see [Plans in this Stripe account](#plans-in-this-stripe-account)
> above. Skip to step 2. This section is here for reference or a fresh account.

In the [Stripe Dashboard](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/products) → **Product
catalog** → **Add product**, create two products, each with a **recurring,
monthly** price:

| Product | Price | Billing period |
| ------- | ----- | -------------- |
| Pro     | $19.99 | Monthly (recurring) |
| Premium | $99.99 | Monthly (recurring) |

After saving each, copy its **Price ID** (looks like `price_1AbC...`). You need
the price ID, not the product ID.

> Use **Test mode** first (toggle in the dashboard). Test and live mode have
> separate keys and price IDs.

---

## 2. Get your API keys

Stripe Dashboard → **Developers → API keys**
([open](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/apikeys)):

- Copy the **Secret key**. Because the plans above are live-mode, use the
  **live** secret key (`sk_live_...`).

---

## 3. Set environment variables

Add these to `.env.local` (and to your hosting provider's env settings for
production). See `.env.example` for the placeholders.

```bash
STRIPE_SECRET_KEY="sk_live_..."                          # from step 2
STRIPE_PRICE_PRO="price_1SUwVnEPcPpjnMfBiYo33hHc"        # Pro (already set)
STRIPE_PRICE_PREMIUM="price_1RNPzsEPcPpjnMfBuURmt3Bi"    # Premium (already set)
STRIPE_WEBHOOK_SECRET="whsec_..."                        # from step 4
```

The two `STRIPE_PRICE_*` values are already filled in `.env.local`; you just need
to add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

You also need these (already required by the app):

```bash
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."          # webhook uses this to update users.tier
```

Restart the dev server after editing env vars.

---

## 4. Configure the webhook

The webhook keeps `users.tier` and `public.subscriptions` in sync when a
subscription is created, updated, or canceled.

### Production

Stripe Dashboard → **Developers → Webhooks → Add endpoint**
([open](https://dashboard.stripe.com/acct_1NuwUHEPcPpjnMfB/webhooks)):

- **Endpoint URL:** `https://YOUR_DOMAIN/api/billing/webhook`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Save, then click **Reveal** on the endpoint's **Signing secret** (`whsec_...`)
  and put it in `STRIPE_WEBHOOK_SECRET`.

### Local testing

Stripe can't reach `localhost`, so use the
[Stripe CLI](https://docs.stripe.com/stripe-cli) to forward webhook events.

**1. Install and log in**

```bash
brew install stripe/stripe-cli/stripe   # macOS (Homebrew)
stripe login                            # opens the browser to authorize
```

**2. Forward events to your local server**

Keep this running in its own terminal while you test:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

It prints a signing secret like `whsec_...`. Put that in `.env.local` as
`STRIPE_WEBHOOK_SECRET`, then **restart `pnpm dev`** so it loads.

> **Match the mode.** `stripe listen` defaults to **test** mode. The webhook
> re-fetches the subscription with `STRIPE_SECRET_KEY`, so that key must be in
> the same mode as the CLI. For test mode use a `sk_test_...` key and
> **test-mode** price IDs; add `--live` to `stripe listen` (and use `sk_live_...`)
> to test against the live plans above.

**3. Run the real flow**

Open `http://localhost:3000/settings` → **Subscription** → **Upgrade to Pro**,
and pay on Stripe Checkout. In test mode use card `4242 4242 4242 4242`, any
future expiry, any CVC/ZIP.

You return to `/settings?checkout=success`; the `stripe listen` terminal shows
`checkout.session.completed` and `customer.subscription.created` being forwarded,
and `users.tier` flips to `pro`. Then try **Cancel membership** / **Resume**.

> `stripe trigger checkout.session.completed` is *not* a full test here — its
> synthetic subscription has no `supabase_user_id` metadata, so the webhook can't
> map it to a user and will skip it. Always test through the UI so the metadata
> is attached.

### Test mode vs. live

The plans above are **live-mode** prices, so paying locally with a live key
charges real money. To test without charges, switch the dashboard to **Test
mode**, create test Pro/Premium prices, and temporarily set `sk_test_...` and
the test price IDs in `.env.local`. Revert to the live values before deploying.

---

## 5. Database

No new tables are needed — the app uses your existing schema:

- **`public.subscriptions`** — the webhook upserts subscription rows here
  (matching your existing columns: `id`, `user_id`, `status`, `price_id`,
  `cancel_at_period_end`, period timestamps, etc.).
- **`public.users.tier`** — set to `pro` / `premium` while active, `free`
  otherwise.

> **`subscriptions.price_id` foreign key:** it references `prices(id)`. Make sure
> the two Stripe price IDs from step 1 exist as rows in your `prices` table
> (they are, if your platform's product/price sync already runs). If a price is
> missing, the app still records the subscription and sets the tier — it just
> stores `price_id` as null for that row.

---

## 6. Verify

1. Sign in, go to **Settings → Subscription**.
2. Click **Upgrade to Pro** → you should land on Stripe Checkout.
3. Pay with the test card `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.
4. You return to `/settings?checkout=success`; within a moment `users.tier`
   becomes `pro` and the card shows **Active**.
5. Click **Cancel membership** → the banner shows it will cancel at period end.
   **Resume membership** reverses it.

---

## How it maps together

- **Upgrade:** `POST /api/billing/checkout` creates a Checkout Session for the
  selected price, tagging the subscription with `metadata.supabase_user_id`.
- **Sync:** `POST /api/billing/webhook` reads that metadata to find the user,
  upserts `subscriptions`, and sets `users.tier`.
- **Cancel / resume:** `POST /api/billing/cancel` toggles
  `cancel_at_period_end` on the Stripe subscription (the webhook syncs it back).
- **Read status:** `GET /api/billing/subscription` returns the user's tier and
  current subscription for the account page.

Plan names, prices shown in the UI, and which env var holds each price ID live in
`lib/billing/plans.ts`.
