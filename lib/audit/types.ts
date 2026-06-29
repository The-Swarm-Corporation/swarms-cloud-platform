export const AUDIT_ACTOR_KINDS = ['user', 'system', 'api_key', 'webhook'] as const;
export type AuditActorKind = (typeof AUDIT_ACTOR_KINDS)[number];

export const AUDIT_TARGET_KINDS = [
  'agent',
  'member',
  'api_key',
  'billing',
  'session',
  'organization',
  'notification',
  'settings',
  'credits',
] as const;
export type AuditTargetKind = (typeof AUDIT_TARGET_KINDS)[number];

export const AUDIT_ACTIONS = [
  'member.invited',
  'member.invite_resent',
  'member.invite_revoked',
  'member.joined',
  'member.role_changed',
  'member.removed',
  'api_key.created',
  'api_key.rotated',
  'api_key.deleted',
  'agent.created',
  'agent.updated',
  'agent.deleted',
  'swarm.executed',
  'credits.topped_up',
  'subscription.changed',
  'payment_method.added',
  'payment_method.removed',
  'invoice.failed',
  'auth.signed_in',
  'auth.signed_out',
  'auth.password_changed',
  'auth.new_device',
  'auth.suspicious_activity',
  'settings.updated',
  'notification_prefs.updated',
  'webhook.added',
  'webhook.removed',
  'organization.created',
  'organization.renamed',
  'organization.transferred',
  'organization.deleted',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_CATEGORIES = [
  'Members',
  'API keys',
  'Agents',
  'Swarms',
  'Billing',
  'Security',
  'Settings',
  'Organization',
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_ACTION_CATEGORIES: Record<AuditAction, AuditCategory> = {
  'member.invited': 'Members',
  'member.invite_resent': 'Members',
  'member.invite_revoked': 'Members',
  'member.joined': 'Members',
  'member.role_changed': 'Members',
  'member.removed': 'Members',
  'api_key.created': 'API keys',
  'api_key.rotated': 'API keys',
  'api_key.deleted': 'API keys',
  'agent.created': 'Agents',
  'agent.updated': 'Agents',
  'agent.deleted': 'Agents',
  'swarm.executed': 'Swarms',
  'credits.topped_up': 'Billing',
  'subscription.changed': 'Billing',
  'payment_method.added': 'Billing',
  'payment_method.removed': 'Billing',
  'invoice.failed': 'Billing',
  'auth.signed_in': 'Security',
  'auth.signed_out': 'Security',
  'auth.password_changed': 'Security',
  'auth.new_device': 'Security',
  'auth.suspicious_activity': 'Security',
  'settings.updated': 'Settings',
  'notification_prefs.updated': 'Settings',
  'webhook.added': 'Settings',
  'webhook.removed': 'Settings',
  'organization.created': 'Organization',
  'organization.renamed': 'Organization',
  'organization.transferred': 'Organization',
  'organization.deleted': 'Organization',
};

export const AUDIT_SEVERITY_ACTIONS: AuditAction[] = [
  'auth.suspicious_activity',
  'invoice.failed',
  'member.removed',
  'api_key.deleted',
  'organization.deleted',
];

export interface AuditEvent {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  actor_kind: AuditActorKind;
  actor_email?: string | null;
  action: AuditAction;
  target_kind: AuditTargetKind;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogAuditEventParams {
  action: AuditAction;
  targetKind: AuditTargetKind;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  actorUserId?: string;
  actorKind?: AuditActorKind;
  ipAddress?: string;
  userAgent?: string;
}
