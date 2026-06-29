'use client';

import { useState } from 'react';
import { ChevronRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';
import { AUDIT_SEVERITY_ACTIONS } from '@/lib/audit/types';

interface AuditTableProps {
  events: AuditEvent[];
  isLoading: boolean;
  error: string | null;
}

export function AuditTable({ events, isLoading, error }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-border border-t-foreground rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-danger">
        <ShieldAlert className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No audit events found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden w-full max-w-full">
      <div
        className="overflow-x-auto max-w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="w-8 px-2 h-10" />
              <th className="px-4 h-10 text-left whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Time
                </span>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Actor
                </span>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Action
                </span>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Target
                </span>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap hidden md:table-cell">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  IP
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <AuditRow
                key={event.id}
                event={event}
                expanded={expandedId === event.id}
                onToggle={() =>
                  setExpandedId((id) => (id === event.id ? null : event.id))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditRow({
  event,
  expanded,
  onToggle,
}: {
  event: AuditEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { date, time, tooltip } = formatTimestamp(event.created_at);
  const isSeverity = AUDIT_SEVERITY_ACTIONS.includes(event.action);

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
          expanded ? 'bg-muted/60' : 'hover:bg-muted/50'
        }`}
      >
        <td className="px-2 py-3 align-middle">
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </td>
        <td className="px-4 py-3 align-middle whitespace-nowrap">
          <div
            className="text-sm text-foreground"
            title={tooltip}
          >
            {date}
          </div>
          {time && (
            <div className="text-[11px] text-muted-foreground">{time}</div>
          )}
        </td>
        <td className="px-4 py-3 align-middle">
          <div className="flex items-center gap-2">
            {isSeverity && (
              <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
            )}
            <span className="text-sm text-foreground">
              {formatActor(event)}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 align-middle min-w-[180px]">
          <span className="text-sm text-foreground">
            {formatAction(event)}
          </span>
        </td>
        <td className="px-4 py-3 align-middle min-w-[120px]">
          {event.target_label ? (
            <span className="text-sm text-foreground">{event.target_label}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-4 py-3 align-middle hidden md:table-cell">
          <span className="text-xs text-muted-foreground font-mono">
            {event.ip_address ?? '—'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border last:border-b-0 bg-subtle/40">
          <td colSpan={6} className="px-4 sm:px-6 py-4">
            <AuditDetail event={event} />
          </td>
        </tr>
      )}
    </>
  );
}

function AuditDetail({ event }: { event: AuditEvent }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider">Event ID</span>
          <code className="block text-foreground font-mono">{event.id}</code>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider">Target ID</span>
          <code className="block text-foreground font-mono">{event.target_id ?? '—'}</code>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider">Target Kind</span>
          <code className="block text-foreground font-mono">{event.target_kind}</code>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground uppercase tracking-wider">Actor Kind</span>
          <code className="block text-foreground font-mono">{event.actor_kind}</code>
        </div>
      </div>
      {Object.keys(event.metadata).length > 0 && (
        <div className="space-y-1.5">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
            Metadata
          </span>
          <pre className="bg-card border border-border rounded-md p-3 text-xs text-foreground/90 whitespace-pre-wrap break-words font-mono overflow-auto max-h-40">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
      {event.user_agent && (
        <div className="space-y-1.5">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
            User Agent
          </span>
          <div className="bg-card border border-border rounded-md p-3 text-xs text-foreground/90 break-all">
            {event.user_agent}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): {
  date: string;
  time: string;
  tooltip: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: iso, time: '', tooltip: iso };
  }
  const local = d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const utc = d.toUTCString();
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tooltip: `${local}\n(UTC: ${utc})`,
  };
}

function formatActor(event: AuditEvent): string {
  if (event.actor_kind === 'system') return 'System';
  if (event.actor_kind === 'api_key') return `API key ••••${event.actor_user_id?.slice(-4) ?? ''}`;
  if (event.actor_kind === 'webhook') return 'Webhook';
  if (event.actor_email) return event.actor_email;
  if (event.actor_user_id) return event.actor_user_id;
  return 'Unknown';
}

function formatAction(event: AuditEvent): string {
  const actionLabels: Record<string, string> = {
    'auth.signed_in': 'Signed in',
    'auth.signed_out': 'Signed out',
    'auth.password_changed': 'Changed password',
    'auth.new_device': 'New device sign-in',
    'auth.suspicious_activity': 'Suspicious activity',
    'api_key.created': 'Created API key',
    'api_key.rotated': 'Rotated API key',
    'api_key.deleted': 'Deleted API key',
    'agent.created': 'Created agent',
    'agent.updated': 'Updated agent',
    'agent.deleted': 'Deleted agent',
    'swarm.executed': 'Executed swarm',
    'credits.topped_up': 'Topped up credits',
    'subscription.changed': 'Changed subscription',
    'payment_method.added': 'Added payment method',
    'payment_method.removed': 'Removed payment method',
    'invoice.failed': 'Invoice failed',
    'settings.updated': 'Updated settings',
    'notification_prefs.updated': 'Updated notification prefs',
    'webhook.added': 'Added webhook',
    'webhook.removed': 'Removed webhook',
    'member.invited': 'Invited member',
    'member.invite_resent': 'Resent invite',
    'member.invite_revoked': 'Revoked invite',
    'member.joined': 'Member joined',
    'member.role_changed': 'Changed member role',
    'member.removed': 'Removed member',
    'organization.created': 'Created organization',
    'organization.renamed': 'Renamed organization',
    'organization.transferred': 'Transferred organization',
    'organization.deleted': 'Deleted organization',
  };
  return actionLabels[event.action] ?? event.action;
}
