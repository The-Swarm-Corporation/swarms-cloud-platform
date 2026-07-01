-- Audit events: append-only, timestamped record of every account-affecting action.
-- Run this via the Supabase SQL Editor or CLI.

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT auth.uid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_kind text NOT NULL DEFAULT 'user' CHECK (actor_kind IN ('user', 'system', 'api_key', 'webhook')),
  action text NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN (
    'agent', 'member', 'api_key', 'billing', 'session', 'organization', 'notification', 'settings'
  )),
  target_id text,
  target_label text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the read-heavy /audit-log page
CREATE INDEX IF NOT EXISTS idx_audit_events_org_created
  ON public.audit_events (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_action
  ON public.audit_events (org_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_target
  ON public.audit_events (org_id, target_kind, target_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON public.audit_events (org_id, actor_user_id, created_at DESC);

-- Full-text search over human-readable fields
CREATE INDEX IF NOT EXISTS idx_audit_events_search
  ON public.audit_events USING gin (to_tsvector('english', COALESCE(action, '') || ' ' || COALESCE(target_label, '') || ' ' || COALESCE(metadata::text, '')));

-- Enable RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Members can SELECT only their own org's events.
-- For now (pre-workspaces), this means the authenticated user sees events
-- where org_id = their own user id, or where they are the actor.
CREATE POLICY audit_select_own_org ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (org_id = auth.uid());

-- Only the service role (bypassing RLS) can INSERT.
-- Client-role JWTs cannot insert directly; all writes go via the server
-- helper that uses the service-role client.
-- This is enforced by having no INSERT policy for anon/authenticated.

-- Revoke UPDATE / DELETE from all roles except service_role
-- (Supabase service role bypasses RLS by default.)
REVOKE UPDATE, DELETE ON public.audit_events FROM anon, authenticated;

COMMENT ON TABLE public.audit_events IS
  'Append-only audit trail for account-affecting actions. Writes only via service-role helper.';
