'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { apiFetch } from '@/lib/api/client-fetch';
import { downloadCsv, csvTimestamp } from '@/lib/utils/csv';
import {
  DATE_PRESETS,
  getActiveRange,
  type DatePreset,
} from '@/lib/utils/date-window';
import {
  Shield,
  Loader2,
  RefreshCw,
  XCircle,
  Download,
  ChevronDown,
  ChevronRight,
  User,
  Bot,
  Key,
  CreditCard,
  Settings2,
  Users,
  Bell,
  Building2,
  Lock,
  Activity,
} from 'lucide-react';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface AuditEvent {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  actor_kind: 'user' | 'system' | 'api_key' | 'webhook';
  action: string;
  target_kind: string;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'agent', label: 'Agents' },
  { value: 'member', label: 'Members' },
  { value: 'api_key', label: 'API Keys' },
  { value: 'billing', label: 'Billing' },
  { value: 'session', label: 'Security' },
  { value: 'organization', label: 'Organization' },
  { value: 'notification', label: 'Notifications' },
  { value: 'settings', label: 'Settings' },
];

const TARGET_KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  agent: Bot,
  member: Users,
  api_key: Key,
  billing: CreditCard,
  session: Lock,
  organization: Building2,
  notification: Bell,
  settings: Settings2,
};

function actionCategory(action: string): string {
  if (action.startsWith('member.')) return 'member';
  if (action.startsWith('api_key.')) return 'api_key';
  if (action.startsWith('agent.')) return 'agent';
  if (action.startsWith('swarm.')) return 'agent';
  if (action.startsWith('credits.') || action.startsWith('subscription.') || action.startsWith('payment_method.') || action.startsWith('invoice.')) return 'billing';
  if (action.startsWith('auth.')) return 'session';
  if (action.startsWith('settings.') || action.startsWith('notification_prefs.') || action.startsWith('webhook.')) return 'settings';
  if (action.startsWith('organization.')) return 'organization';
  return 'settings';
}

function actionSeverity(action: string): 'neutral' | 'warning' | 'danger' {
  if (action.startsWith('auth.')) return 'danger';
  if (action.startsWith('credits.') || action.startsWith('invoice.')) return 'warning';
  if (action.startsWith('member.removed') || action.startsWith('api_key.deleted') || action.startsWith('agent.deleted')) return 'warning';
  return 'neutral';
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function actionToDisplay(action: string, label?: string | null): string {
  const map: Record<string, string> = {
    'member.invited': 'Invited member',
    'member.invite_resent': 'Resent invite',
    'member.invite_revoked': 'Revoked invite',
    'member.joined': 'Member joined',
    'member.role_changed': 'Changed role',
    'member.removed': 'Removed member',
    'api_key.created': 'Created API key',
    'api_key.rotated': 'Rotated API key',
    'api_key.deleted': 'Deleted API key',
    'agent.created': 'Created agent',
    'agent.updated': 'Updated agent',
    'agent.deleted': 'Deleted agent',
    'swarm.executed': 'Ran swarm',
    'credits.topped_up': 'Topped up credits',
    'subscription.changed': 'Changed subscription',
    'payment_method.added': 'Added payment method',
    'payment_method.removed': 'Removed payment method',
    'invoice.failed': 'Invoice failed',
    'auth.signed_in': 'Signed in',
    'auth.signed_out': 'Signed out',
    'auth.password_changed': 'Changed password',
    'auth.new_device': 'New device detected',
    'auth.suspicious_activity': 'Suspicious activity',
    'settings.updated': 'Updated settings',
    'notification_prefs.updated': 'Updated notifications',
    'webhook.added': 'Added webhook',
    'webhook.removed': 'Removed webhook',
    'organization.created': 'Created organization',
    'organization.renamed': 'Renamed organization',
    'organization.transferred': 'Transferred organization',
    'organization.deleted': 'Deleted organization',
  };
  const base = map[action] ?? action;
  if (label) return `${base} — ${label}`;
  return base;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function AuditLogPage() {
  const hydrated = useIsHydrated();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeRange = useMemo<{ from: number; to: number } | null>(
    () => getActiveRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const activePresetLabel =
    DATE_PRESETS.find((p) => p.id === datePreset)?.label ?? 'All time';

  const hasActiveFilter =
    !!searchQuery.trim() ||
    categoryFilter !== 'all' ||
    actorFilter !== 'all' ||
    datePreset !== 'all' ||
    customFrom !== '' ||
    customTo !== '';

  const fetchEvents = React.useCallback(
    async (opts?: { force?: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (searchQuery) params.set('search', searchQuery);
        if (categoryFilter !== 'all') params.set('target_kind', categoryFilter);
        if (actorFilter !== 'all') params.set('actor_user_id', actorFilter);
        if (activeRange) {
          params.set('date_from', new Date(activeRange.from).toISOString());
          params.set('date_to', new Date(activeRange.to).toISOString());
        }
        const res = await apiFetch(`/api/audit-log?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed (${res.status})`);
        }
        const data: AuditLogResponse = await res.json();
        setEvents(data.events);
        setTotal(data.total);
      } catch (e: any) {
        setError(e?.message || 'Failed to load audit log');
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, searchQuery, categoryFilter, actorFilter, activeRange],
  );

  React.useEffect(() => {
    if (hydrated) fetchEvents();
  }, [hydrated, fetchEvents]);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, actorFilter, datePreset, customFrom, customTo]);

  const totalPages = Math.ceil(total / limit);

  const handleExportCsv = () => {
    const headers = [
      'timestamp_utc',
      'actor_name',
      'actor_kind',
      'action',
      'target_kind',
      'target_label',
      'target_id',
      'ip_address',
      'user_agent',
      'metadata_json',
    ];
    const rows = events.map((e) => [
      e.created_at,
      e.actor_user_id ?? 'system',
      e.actor_kind,
      e.action,
      e.target_kind,
      e.target_label ?? '',
      e.target_id ?? '',
      e.ip_address ?? '',
      e.user_agent ?? '',
      JSON.stringify(e.metadata),
    ]);
    downloadCsv(`audit_log_${csvTimestamp()}.csv`, headers, rows);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground">Compliance</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Audit log
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Append-only record of every account-affecting action.
              </p>
            </div>
            {!(isLoading && events.length === 0) && (
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap flex-shrink-0 sm:self-end sm:pb-1">
                <span className="text-foreground font-medium">
                  {events.length.toLocaleString()}
                </span>{' '}
                of {total.toLocaleString()} events
              </span>
            )}
          </div>

          {/* Toolbar */}
          {!(isLoading && events.length === 0) && (
            <div className="mb-5 pb-4 border-b border-border flex flex-col gap-2.5">
              {/* Row 1 — Search + actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by action, target, actor…"
                  className="flex-1 min-w-0"
                />
                <div className="flex items-center gap-2">
                  {events.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      aria-label="Export audit log as CSV"
                      title="Export as CSV"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchEvents({ force: true })}
                    disabled={isLoading}
                    aria-label="Refresh"
                    title="Refresh"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Row 2 — Date range + Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="radiogroup"
                  aria-label="Date range"
                  className="inline-flex items-center gap-0.5 rounded-md border border-border bg-subtle p-0.5"
                >
                  {DATE_PRESETS.map((p) => {
                    const active = datePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDatePreset(p.id)}
                        className={`inline-flex items-center justify-center px-2.5 h-7 rounded text-xs font-medium transition-colors ${
                          active
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {datePreset === 'custom' && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wider">From</span>
                      <input
                        type="date"
                        value={customFrom}
                        max={customTo || undefined}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="h-7 px-2 rounded-md border border-border bg-input text-foreground text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wider">To</span>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom || undefined}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="h-7 px-2 rounded-md border border-border bg-input text-foreground text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      />
                    </label>
                    {(customFrom || customTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFrom('');
                          setCustomTo('');
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {datePreset !== 'custom' && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    Window: {activePresetLabel}
                  </span>
                )}
              </div>

              {/* Row 3 — Category filter + clear */}
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={CATEGORY_OPTIONS}
                />
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setActorFilter('all');
                      setDatePreset('all');
                      setCustomFrom('');
                      setCustomTo('');
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && events.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading audit log…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={() => fetchEvents({ force: true })}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Audit events appear here once actions are recorded."
            />
          ) : (
            <>
              <div className="rounded-lg border border-border bg-card overflow-hidden w-full max-w-full">
                <div className="overflow-x-auto max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full min-w-[680px]">
                    <thead>
                      <tr className="border-b border-border bg-subtle">
                        <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[120px]">
                          Time
                        </th>
                        <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Actor
                        </th>
                        <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Action
                        </th>
                        <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Target
                        </th>
                        <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                          IP
                        </th>
                        <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[60px]">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => {
                        const sev = actionSeverity(event.action);
                        const isExpanded = expandedId === event.id;
                        const Icon =
                          TARGET_KIND_ICON[event.target_kind] ?? Activity;
                        return (
                          <React.Fragment key={event.id}>
                            <tr
                              className={`border-b border-border last:border-b-0 transition-colors hover:bg-muted/50 ${
                                sev === 'danger'
                                  ? 'bg-danger/5'
                                  : sev === 'warning'
                                  ? 'bg-warning/5'
                                  : ''
                              }`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className="text-xs text-muted-foreground tabular-nums"
                                  title={new Date(event.created_at).toLocaleString()}
                                >
                                  {formatRelativeTime(event.created_at)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    {event.actor_kind === 'system' ? (
                                      <Bot className="w-3 h-3 text-muted-foreground" />
                                    ) : (
                                      <User className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="text-xs text-foreground">
                                    {event.actor_kind === 'system'
                                      ? 'System'
                                      : event.actor_user_id
                                      ? 'User'
                                      : 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {sev !== 'neutral' && (
                                    <span
                                      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                        sev === 'danger'
                                          ? 'bg-danger'
                                          : 'bg-warning'
                                      }`}
                                    />
                                  )}
                                  <span className="text-xs text-foreground">
                                    {actionToDisplay(event.action, event.target_label)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-subtle text-[11px] text-muted-foreground border border-border">
                                  <Icon className="w-3 h-3" />
                                  {event.target_kind}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                                  {event.ip_address ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedId(isExpanded ? null : event.id)
                                  }
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-border bg-subtle/50">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="space-y-2">
                                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                                      Metadata
                                    </div>
                                    <pre className="text-[11px] font-mono text-foreground bg-muted rounded-md p-3 overflow-x-auto">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                    {event.user_agent && (
                                      <div className="text-[11px] text-muted-foreground">
                                        User-Agent: {event.user_agent}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  itemsPerPage={limit}
                  totalItems={total}
                  onItemsPerPageChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="uppercase tracking-wider">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 pl-2.5 pr-7 rounded-md border border-border bg-subtle text-foreground text-xs font-medium appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-muted transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none"
        >
          <path
            d="M3 5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </label>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-subtle/50 p-10">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Shield className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {description}
      </p>
    </div>
  );
}
