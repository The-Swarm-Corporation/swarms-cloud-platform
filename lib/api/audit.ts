'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import type { AuditAction, AuditTargetKind } from '@/types/audit';

interface LogAuditEventOptions {
  action: AuditAction;
  targetKind: AuditTargetKind;
  targetId?: string;
  targetLabel?: string;
  actorUserId?: string | null;
  actorKind?: 'user' | 'system' | 'api_key' | 'webhook';
  metadata?: Record<string, unknown>;
  orgId?: string;
}

/**
 * Write an audit event row.
 *
 * - Auto-captures IP and user-agent from the incoming request headers.
 * - Uses the service-role client so it bypasses RLS.
 * - Never throws; failures are logged but not blocking.
 */
export async function logAuditEvent(
  opts: LogAuditEventOptions,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn('[logAuditEvent] admin client unavailable — skipping');
    return;
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? headerStore.get('x-real-ip');
  const userAgent = headerStore.get('user-agent');

  const row = {
    org_id: opts.orgId ?? opts.actorUserId ?? '00000000-0000-0000-0000-000000000000',
    actor_user_id: opts.actorUserId ?? null,
    actor_kind: opts.actorKind ?? 'user',
    action: opts.action,
    target_kind: opts.targetKind,
    target_id: opts.targetId ?? null,
    target_label: opts.targetLabel ?? null,
    metadata: opts.metadata ?? {},
    ip_address: ip,
    user_agent: userAgent,
  };

  try {
    const { error } = await admin.from('audit_events').insert(row);
    if (error) {
      console.error('[logAuditEvent] insert failed', {
        action: opts.action,
        code: error.code,
        message: error.message,
      });
    }
  } catch (e) {
    console.error('[logAuditEvent] unexpected error', {
      action: opts.action,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
