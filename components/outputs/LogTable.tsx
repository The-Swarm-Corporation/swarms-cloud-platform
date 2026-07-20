'use client';

import React, { useState } from 'react';
import { SwarmLogEntry } from '@/lib/hooks/useSwarmLogs';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

export type LogSortKey = 'timestamp' | 'agent' | 'tokens' | 'cost';
export type LogSortOrder = 'asc' | 'desc';

function formatDate(timestamp: string | null): { date: string; time: string } {
  if (!timestamp) return { date: ' - ', time: '' };
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return { date: timestamp, time: '' };
  return {
    date: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

function stringifyResponse(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.text === 'string') return rec.text;
    if (typeof rec.content === 'string') return rec.content;
    if (typeof rec.message === 'string') return rec.message;
    if (typeof rec.result === 'string') return rec.result;
    if (Array.isArray(value)) {
      return value
        .map((it) => (typeof it === 'string' ? it : JSON.stringify(it, null, 2)))
        .join('\n\n');
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function compactNumber(n: number): string {
  if (n < 1000) return n.toLocaleString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function tokensOf(entry: SwarmLogEntry): number {
  const u = entry.usage;
  if (!u) return -1;
  if (typeof u.total_tokens === 'number') return u.total_tokens;
  const sum = (u.input_tokens ?? 0) + (u.output_tokens ?? 0);
  return sum > 0 ? sum : -1;
}

function costOf(entry: SwarmLogEntry): number {
  return typeof entry.usage?.total_cost === 'number'
    ? entry.usage.total_cost
    : -1;
}

/** Sort the full result set by the active column (call before paginating). */
export function sortLogs(
  entries: SwarmLogEntry[],
  sortKey: LogSortKey,
  sortOrder: LogSortOrder
): SwarmLogEntry[] {
  const dir = sortOrder === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'timestamp': {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        cmp = ta - tb;
        break;
      }
      case 'agent':
        cmp = (a.agentName || a.endpoint || '').localeCompare(
          b.agentName || b.endpoint || ''
        );
        break;
      case 'tokens':
        cmp = tokensOf(a) - tokensOf(b);
        break;
      case 'cost':
        cmp = costOf(a) - costOf(b);
        break;
    }
    return cmp * dir;
  });
}

export function LogTable({
  entries,
  sortKey,
  sortOrder,
  onSort,
}: {
  entries: SwarmLogEntry[];
  sortKey: LogSortKey;
  sortOrder: LogSortOrder;
  onSort: (key: LogSortKey) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = onSort;
  const sorted = entries;

  const sortHeader =
    'inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors';
  const arrow = (key: LogSortKey) =>
    sortKey === key ? (sortOrder === 'asc' ? '↑' : '↓') : '';

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
                  Status
                </span>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('agent')}
                  className={sortHeader}
                >
                  Agent / Endpoint <span className="w-2">{arrow('agent')}</span>
                </button>
              </th>
              <th className="px-4 h-10 text-left whitespace-nowrap hidden lg:table-cell">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Task
                </span>
              </th>
              <th className="px-4 h-10 text-right whitespace-nowrap hidden sm:table-cell">
                <button
                  type="button"
                  onClick={() => toggleSort('tokens')}
                  className={`${sortHeader} justify-end w-full`}
                >
                  Tokens <span className="w-2">{arrow('tokens')}</span>
                </button>
              </th>
              <th className="px-4 h-10 text-right whitespace-nowrap hidden md:table-cell">
                <button
                  type="button"
                  onClick={() => toggleSort('cost')}
                  className={`${sortHeader} justify-end w-full`}
                >
                  Cost <span className="w-2">{arrow('cost')}</span>
                </button>
              </th>
              <th className="px-4 h-10 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('timestamp')}
                  className={`${sortHeader} justify-end w-full`}
                >
                  Time <span className="w-2">{arrow('timestamp')}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <LogRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() =>
                  setExpandedId((id) => (id === entry.id ? null : entry.id))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: SwarmLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { date, time } = formatDate(entry.timestamp);
  const tokens = tokensOf(entry);
  const cost = costOf(entry);
  const label = entry.agentName || entry.endpoint || `Log ${entry.id}`;

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
        <td className="px-4 py-3 whitespace-nowrap align-middle">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              entry.success
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
          >
            {entry.success ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {entry.success ? 'Success' : 'Failed'}
          </span>
        </td>
        <td className="px-4 py-3 align-middle min-w-[180px] max-w-[280px]">
          <div
            className="text-sm font-medium text-foreground font-mono truncate"
            title={label}
          >
            {label}
          </div>
          {entry.endpoint && entry.agentName && (
            <div className="text-xs text-muted-foreground font-mono truncate">
              {entry.endpoint}
            </div>
          )}
        </td>
        <td className="px-4 py-3 align-middle hidden lg:table-cell max-w-[320px]">
          <div className="text-xs text-muted-foreground truncate">
            {entry.task || <span className="text-muted-foreground/50"> - </span>}
          </div>
        </td>
        <td className="px-4 py-3 text-right align-middle hidden sm:table-cell">
          {tokens >= 0 ? (
            <span
              className="font-mono text-xs text-foreground tabular-nums"
              title={`${tokens.toLocaleString()} tokens`}
            >
              {compactNumber(tokens)}
            </span>
          ) : (
            <span className="text-muted-foreground/50"> - </span>
          )}
        </td>
        <td className="px-4 py-3 text-right align-middle hidden md:table-cell">
          {cost >= 0 ? (
            <span className="font-mono text-xs text-success tabular-nums">
              ${cost.toFixed(4)}
            </span>
          ) : (
            <span className="text-muted-foreground/50"> - </span>
          )}
        </td>
        <td className="px-4 py-3 text-right align-middle whitespace-nowrap">
          <div className="font-mono text-xs text-foreground tabular-nums">
            {date}
          </div>
          {time && (
            <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {time}
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border last:border-b-0 bg-subtle/40">
          <td colSpan={7} className="px-4 sm:px-6 py-4">
            <LogDetail entry={entry} />
          </td>
        </tr>
      )}
    </>
  );
}

function LogDetail({ entry }: { entry: SwarmLogEntry }) {
  const responseText = stringifyResponse(entry.response);
  const [copied, setCopied] = useState(false);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(entry.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
            ID
          </span>
          <code className="font-mono text-foreground">{entry.id}</code>
          <button
            type="button"
            onClick={copyId}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Copy ID"
          >
            {copied ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
        {entry.endpoint && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
              Endpoint
            </span>
            <code className="font-mono text-foreground">{entry.endpoint}</code>
          </div>
        )}
      </div>

      {/* Usage breakdown */}
      {entry.usage && (
        <div className="flex flex-wrap gap-2">
          {entry.usage.input_tokens !== undefined && (
            <UsagePill label="Input" value={`${entry.usage.input_tokens.toLocaleString()} tok`} />
          )}
          {entry.usage.output_tokens !== undefined && (
            <UsagePill label="Output" value={`${entry.usage.output_tokens.toLocaleString()} tok`} />
          )}
          {entry.usage.total_tokens !== undefined && (
            <UsagePill label="Total" value={`${entry.usage.total_tokens.toLocaleString()} tok`} />
          )}
          {entry.usage.total_cost !== undefined && (
            <UsagePill label="Cost" value={`$${entry.usage.total_cost.toFixed(4)}`} accent />
          )}
        </div>
      )}

      {/* Task */}
      {entry.task && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Task
          </div>
          <div className="bg-card border border-border rounded-md p-3 text-xs text-foreground/90 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {entry.task}
          </div>
        </div>
      )}

      {/* Response */}
      {responseText && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Response
          </div>
          <div className="bg-card border border-border rounded-md p-3 max-h-80 overflow-auto">
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap break-words font-mono">
              {responseText}
            </pre>
          </div>
        </div>
      )}

      {!entry.task && !responseText && !entry.usage && (
        <p className="text-xs text-muted-foreground">
          No additional details for this log.
        </p>
      )}
    </div>
  );
}

function UsagePill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`font-mono text-xs tabular-nums ${
          accent ? 'text-success' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
