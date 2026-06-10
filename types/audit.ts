/**
 * Audit event row — mirrors public.audit_events schema.
 */
export interface AuditEvent {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  actor_kind: 'user' | 'system' | 'api_key' | 'webhook';
  action: string;
  target_kind:
    | 'agent'
    | 'member'
    | 'api_key'
    | 'billing'
    | 'session'
    | 'organization'
    | 'notification'
    | 'settings';
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  // Members
  | 'member.invited'
  | 'member.invite_resent'
  | 'member.invite_revoked'
  | 'member.joined'
  | 'member.role_changed'
  | 'member.removed'
  // API keys
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.deleted'
  // Agents
  | 'agent.created'
  | 'agent.updated'
  | 'agent.deleted'
  // Swarms
  | 'swarm.executed'
  // Billing
  | 'credits.topped_up'
  | 'subscription.changed'
  | 'payment_method.added'
  | 'payment_method.removed'
  | 'invoice.failed'
  // Security
  | 'auth.signed_in'
  | 'auth.signed_out'
  | 'auth.password_changed'
  | 'auth.new_device'
  | 'auth.suspicious_activity'
  // Settings
  | 'settings.updated'
  | 'notification_prefs.updated'
  | 'webhook.added'
  | 'webhook.removed'
  // Organization
  | 'organization.created'
  | 'organization.renamed'
  | 'organization.transferred'
  | 'organization.deleted';

export type AuditTargetKind = AuditEvent['target_kind'];

/**
 * Payload accepted by the /api/audit-log endpoint.
 */
export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  target_kind?: string;
  actor_user_id?: string;
  date_from?: string; // ISO date
  date_to?: string; // ISO date
}

/**
 * Response from the /api/audit-log endpoint.
 */
export interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}
