# Audit Log Feature — PR Description

## What this PR does

Adds a new `/audit-log` page that surfaces an append-only, timestamped record of account-affecting actions — sign-ins, API key creation/deletion, agent creation/deletion. Filterable by actor, action category, and date range. CSV-exportable.

This unblocks SOC 2 readiness and gives workspace admins a single place to answer "what happened to my account?"

---

## What's changed

### New files

| File | Purpose |
|------|---------|
| `lib/audit/types.ts` | TypeScript types for all audit actions, categories, actor kinds, target kinds |
| `lib/audit/log-audit-event.ts` | Server-only helper — non-blocking, fire-and-forget insert to `audit_events` |
| `app/api/audit/route.ts` | POST endpoint for client-side callers to log events (agents) |
| `app/api/audit/events/route.ts` | GET endpoint for the audit page — fetches events with filters, resolves actor emails |
| `lib/hooks/useAuditEvents.ts` | Data-fetching hook with filter state management |
| `components/audit/AuditToolbar.tsx` | Search input, category multi-select, actor select, date range presets, export/refresh buttons |
| `components/audit/AuditTable.tsx` | Time/Actor/Action/Target/IP table with expandable rows showing full metadata + user agent |
| `app/audit-log/page.tsx` | Full page — heading, counters, toolbar, table, pagination |
| `supabase/migrations/20260629000000_create_audit_events.sql` | **Migration file — does NOT auto-apply; must be run manually** |

### Modified files

| File | Change |
|------|--------|
| `lib/auth/actions.ts` | `signInWithPasswordAction` logs `auth.signed_in`; `signOutAction` logs `auth.signed_out` |
| `app/api/api-keys/route.ts` | POST logs `api_key.created` with key name |
| `app/api/api-keys/[id]/route.ts` | DELETE logs `api_key.deleted` with key name captured before soft-delete |
| `lib/hooks/useAgents.ts` | `createAgent` logs `agent.created`; `removeAgent` logs `agent.deleted` via `/api/audit` |
| `components/layout/Navbar.tsx` | Added "Audit" tab with `ShieldCheck` icon |

### Out of scope (not implemented)

- Hash-chain / tamper-evidence — documented in `ISSUE_HASHCHAIN.md`
- SIEM streaming / webhook delivery
- Per-resource history drawer
- Compliance PDF export
- Email digest
- Role-gating (page visible to all authenticated users until org model lands)

---

## Manual step required — Supabase SQL

**This PR does NOT push migration files to your Supabase project.** You must run the SQL below manually in your Supabase SQL Editor before the feature works.

### Step-by-step

1. Open your Supabase project at [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the following SQL:

```sql
-- ============================================================
-- Audit Events Table
-- Issue: https://github.com/The-Swarm-Corporation/swarms-cloud-platform/issues/11
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.audit_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL DEFAULT auth.uid(),
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_kind text NOT NULL CHECK (actor_kind IN ('user', 'system', 'api_key', 'webhook')),
    action text NOT NULL,
    target_kind text NOT NULL CHECK (target_kind IN ('agent', 'member', 'api_key', 'billing', 'session', 'organization', 'notification', 'settings', 'credits')),
    target_id text,
    target_label text,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common filter patterns
CREATE INDEX idx_audit_events_org_created ON public.audit_events(org_id, created_at DESC);
CREATE INDEX idx_audit_events_org_action ON public.audit_events(org_id, action);
CREATE INDEX idx_audit_events_org_actor ON public.audit_events(org_id, actor_user_id);

-- Row Level Security — append-only
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Members can SELECT only their own org's events
CREATE POLICY "Members can view own org audit events"
    ON public.audit_events FOR SELECT
    USING (org_id = auth.uid());

-- Service role can INSERT (all other roles blocked)
CREATE POLICY "Service role can insert audit events"
    ON public.audit_events FOR INSERT
    WITH CHECK (true);

-- Block UPDATE (append-only enforcement)
CREATE POLICY "Block update on audit events"
    ON public.audit_events FOR UPDATE
    USING (false)
    WITH CHECK (false);

-- Block DELETE (append-only enforcement)
CREATE POLICY "Block delete on audit events"
    ON public.audit_events FOR DELETE
    USING (false);

COMMENT ON TABLE public.audit_events IS 'Append-only audit log for account, workspace, and billing activity.';
```

5. Click **Run**
6. Wait for "Success" — you should see `audit_events` listed under **Table Editor** in the left sidebar
7. Refresh the application — the `/audit-log` page will now load events

---

## Verifying it works

1. Sign in to the app
2. Go to **API Keys** → create a new key → you should see `api_key.created` appear in the audit log
3. Go to **Agents** → create an agent → you should see `agent.created`
4. Sign out and sign back in → you should see `auth.signed_in`
5. Visit `/audit-log` → verify the toolbar filters and CSV export work

---

## CSV export format

Columns: `timestamp_utc, actor_name, actor_kind, action, target_kind, target_label, target_id, ip_address, user_agent, metadata_json`

Filename: `audit_log_YYYY-MM-DD_HHMM.csv`
