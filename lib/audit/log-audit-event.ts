import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LogAuditEventParams } from './types';

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) {
      console.error('[audit] Admin client unavailable');
      return;
    }

    const {
      action,
      targetKind,
      targetId,
      targetLabel,
      metadata = {},
      actorUserId,
      actorKind = 'user',
      ipAddress,
      userAgent,
    } = params;

    const { error } = await admin.from('audit_events').insert({
      org_id: actorUserId,
      actor_user_id: actorUserId,
      actor_kind: actorKind,
      action,
      target_kind: targetKind,
      target_id: targetId ?? null,
      target_label: targetLabel ?? null,
      metadata,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });

    if (error) {
      console.error(`[audit] Failed to log event ${action}:`, error.message);
    }
  } catch (err) {
    console.error('[audit] Unexpected error logging audit event:', err);
  }
}
