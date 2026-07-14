# Organization Billing — Business Model Proposal

## Context

Swarms Cloud currently bills **per user, per tier**, via Stripe:

| Plan | Price | Stripe price env |
| --- | --- | --- |
| Pro | $19.99/mo | `STRIPE_PRICE_PRO` |
| Premium | $99.99/mo | `STRIPE_PRICE_PREMIUM` |

Entitlement lives on `public.users.tier`, and `public.subscriptions` tracks one
Stripe subscription per user (`lib/billing/plans.ts`, `lib/billing/service.ts`).
There is no `organization` / `team` concept in the schema today — this has been
on the backlog as "Team workspaces" (`secretive/FEATURES.md`, Identity section)
but not built. This doc proposes the billing model for it; workspace-level
features (shared runs, RBAC) are a separate, dependent effort.

## Recommended model: per-seat billing, org as the paying entity

Each organization is billed centrally for its members' seats, at the existing
per-user prices. This is the standard model for this kind of product (Slack,
Notion, Linear, GitHub Team): one bill, one owner, seats assigned per member.

- **Seat = one member at one tier.** A Pro seat costs $19.99/mo, a Premium seat
  costs $99.99/mo — identical to today's individual prices. No new pricing
  tiers to design or explain; "org billing" is a payment/aggregation model
  layered on top of the pricing that already exists.
- **The org, not the member, pays.** One invoice, one payment method, held by
  the org owner/billing admin. Members consume a seat but don't see a bill.
- **Mixed tiers within one org.** An org isn't forced into "everyone Pro" or
  "everyone Premium" — an admin assigns each member a tier (or `free`), and
  the org is billed for the sum. A 10-person org with 7 Pro + 3 Premium seats
  pays `7 × 19.99 + 3 × 99.99`.
- **Proration on change.** Adding a member, removing a member, or moving a
  member between tiers prorates immediately via Stripe, same as any seat
  upgrade/downgrade does for an individual today.

### Why this over the alternatives

| Alternative | Why not (as the primary model) |
| --- | --- |
| Flat org tiers (e.g. "Org Pro $499/mo for up to 25 seats") | Requires designing and pricing new tiers from scratch, and breaks per-seat cost-attribution that ops/finance want. Worth revisiting later as a packaged "enterprise" option once seat volume data exists — not needed to ship v1. |
| Usage-based (bill per API call / token spend, no seats) | Already the model for the underlying agent/model usage today (Stripe metered items) — this is billing for *plan tier access*, which is inherently a seat concept (rate limits, priority compute, support), not a usage concept. Keep it separate from any future usage-based billing line. |
| Self-serve members (org groups seats but each member's card is charged) | Matches nothing else in the product (individual billing already exists and works fine for that case), and doesn't solve the actual ask — "billing per member" under one org account. Centralized billing is what "org billing" means to a buyer. |

## How other companies do this

| Model | Examples | Mechanics |
| --- | --- | --- |
| Pure per-seat | Slack, Notion, GitHub Team, Zoom, Linear | Fixed price × assigned seats, one invoice to the org. The default for this category — maps directly to per-person value and is trivial to explain to a buyer. This is the model above. |
| Per-seat with seat *types* | Figma (billed "editor" seats, free "viewer" seats), Notion (billed members, free guests) | Splits seats into a billed type (creates/edits) and a free type (consumes only). Useful when a chunk of an org only ever views output rather than building. |
| Fair / active billing | Slack | Only seats that actually logged in during the billing period are charged, not every provisioned seat. Reduces "we paid for 50, 30 ever used it" churn, at the cost of metering complexity. |
| Flat tier + seat cap, then overage | Many mid-market tools, e.g. "$499/mo includes 10 seats, $40/extra seat" | Used when the org tier bundles something beyond linear per-user value (shared infra, higher limits) — the base price isn't just seats × unit cost. |
| Usage-based, no seats | Datadog, Snowflake, Twilio | Bills on resource consumption, not headcount. Not "per member" billing at all — named here as the other end of the spectrum, not a fit for this ask. |
| Self-serve vs sales-assisted split | Nearly all of the above, at scale | Small orgs self-serve on a card with instant ("true-forward") proration. Large orgs sign an annual contract with a minimum committed seat count and "true-up" at renewal instead of prorating every change. Enterprise-motion concern, not v1. |

Given what's already built here (Stripe, per-user tiers, no sales team), pure
per-seat with true-forward proration — the model above — is the closest match
to how Slack/Notion/Linear actually ship this, and the cheapest to build.

## Roles

- **Owner** — one per org (the creator, or transferable). Only role that can
  change the payment method or delete the org.
- **Billing admin** — can add/remove members, assign/change seat tiers, view
  invoices. Distinct from Owner so finance/ops can manage billing without
  full org-admin rights.
- **Member** — consumes a seat (`free`, `pro`, or `premium` tier as assigned).
  No billing visibility beyond "your org's Premium plan," matching how a
  Slack/Notion member sees no invoice.

This role split can start as a single `admin` role (owner == billing admin) if
role-based access isn't otherwise being built yet, but the schema should keep
the concept factored out so RBAC (already backlogged) can plug in later.

## Data model changes

New tables, additive to the existing per-user schema — individual (non-org)
billing keeps working unchanged:

```
organizations
  id, name, owner_user_id, stripe_customer_id, stripe_subscription_id,
  created_at

organization_members
  id, org_id, user_id, role ('owner' | 'billing_admin' | 'member'),
  seat_tier ('free' | 'pro' | 'premium'), invited_at, joined_at

organization_invites
  id, org_id, email, role, seat_tier, token, expires_at, accepted_at
```

`public.users.tier` becomes the *effective* tier: for a user with an active
`organization_members.seat_tier`, that value wins over any personal
subscription. Resolve at the same place `lib/billing/service.ts` currently
sets `users.tier`, rather than duplicating the read path across the app.

## Stripe implementation

One Stripe **Customer** and one Stripe **Subscription** per organization
(not per member). The subscription carries two **subscription items**, one
per price:

- `STRIPE_PRICE_PRO` × quantity = number of members with `seat_tier = 'pro'`
- `STRIPE_PRICE_PREMIUM` × quantity = number of members with `seat_tier = 'premium'`

Adding/removing a seat or changing a member's tier updates the relevant
subscription item's `quantity` via the Stripe API (`proration_behavior:
create_prorations`), which is exactly the pattern Stripe recommends for
per-seat SaaS billing and requires no new product/price objects — it reuses
`prod_TRqCgSiGyO8Os7` (Pro) and `prod_SHzzCFXw488bQP` (Premium) already
provisioned in the Stripe account (`secretive/STRIPE_SETUP.md`).

Webhook handling extends the existing `/api/billing/webhook` route: on
`customer.subscription.updated`, resolve whether `customer.metadata.org_id` is
present (org subscription) vs `supabase_user_id` (individual subscription,
unchanged) and update `organizations`/`organization_members` or
`users`/`subscriptions` accordingly.

## Rollout

1. An existing individual paying user can create an org — their personal
   subscription is cancelled (or left to expire) and replaced by an org
   subscription with them as the first seat, same tier, no gap in access.
2. Owner/billing admin invites members by email; each invite carries a
   proposed seat tier, chargeable once accepted.
3. Members who accept without an existing account go through normal signup,
   landing directly in the org at the invited tier — no separate personal
   checkout flow.
4. Downgrade to `free` seat or removal from the org: immediate quantity
   decrement + proration credit, no forced end-of-period wait.

## Explicitly out of scope for this proposal

- Volume/annual discounts for large seat counts — a pricing decision to make
  once real org seat-count data exists, not a blocker to shipping per-seat
  billing.
- Usage-based add-ons (extra rate limit, dedicated compute) billed on top of
  seats — same shape as today's per-user upsells, deferred.
- Role-based access control beyond the three billing-relevant roles above —
  tracked separately in `secretive/FEATURES.md` under "Role-based access."

## Future refinements (not v1)

- **Seat types (billed vs free).** If teammates who only view dashboards/run
  history show up in practice, split seats the way Figma/Notion do — a free
  "viewer" seat alongside billed Pro/Premium "builder" seats — instead of
  charging a full seat for read-only access.
- **Fair/active billing.** Adopt Slack's approach of only charging for seats
  that logged in during the period, if provisioned-but-unused seats turn out
  to be a churn driver. Requires login-activity metering per seat per period.
- **Enterprise annual contracts with true-up.** For large orgs, move off
  instant Stripe proration to an annual commitment with a minimum seat count,
  billed at signing and trued-up (not down) at renewal. A sales-assisted path
  layered on top of the same `organizations`/`organization_members` tables,
  not a schema change.

## Open questions

- Does an org need a **minimum seat count** or minimum spend, or can it start
  at 1 seat (i.e., org billing is available to solo users who just want an
  invoice instead of a personal card)?
- Should a member removed from an org **keep their data** (agents, run
  history) accessible read-only, or does removal from the org mean loss of
  access entirely?
- Annual billing (discounted, paid upfront) — worth offering at org launch or
  only after seat billing is proven?
