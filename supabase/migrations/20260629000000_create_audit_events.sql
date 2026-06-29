-- Migration: Create audit_events table for account activity logging
-- Issue: https://github.com/The-Swarm-Corporation/swarms-cloud-platform/issues/11

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

CREATE INDEX idx_audit_events_org_created ON public.audit_events(org_id, created_at DESC);
CREATE INDEX idx_audit_events_org_action ON public.audit_events(org_id, action);
CREATE INDEX idx_audit_events_org_actor ON public.audit_events(org_id, actor_user_id);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Members of an org can SELECT only their own org's events
CREATE POLICY "Members can view own org audit events"
    ON public.audit_events FOR SELECT
    USING (org_id = auth.uid());

-- Only service role can INSERT (append-only - no UPDATE/DELETE for client roles)
CREATE POLICY "Service role can insert audit events"
    ON public.audit_events FOR INSERT
    WITH CHECK (true);

-- Block UPDATE and DELETE for non-service roles (append-only enforcement)
CREATE POLICY "Block update on audit events"
    ON public.audit_events FOR UPDATE
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Block delete on audit events"
    ON public.audit_events FOR DELETE
    USING (false);

COMMENT ON TABLE public.audit_events IS 'Append-only audit log for account, workspace, and billing activity. RLS enforces org-scoped reads and append-only writes.';
