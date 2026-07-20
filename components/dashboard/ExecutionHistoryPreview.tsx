'use client';

import React from 'react';
import Link from 'next/link';
import type { SwarmLogEntry } from '@/lib/hooks/useSwarmLogs';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const PREVIEW_LIMIT = 6;

interface ExecutionHistoryPreviewProps {
  logs: SwarmLogEntry[];
  isLoading?: boolean;
}

export function ExecutionHistoryPreview({
  logs,
  isLoading = false,
}: ExecutionHistoryPreviewProps) {
  const recent = logs.slice(0, PREVIEW_LIMIT);

  return (
    <section className="rounded-lg border border-border bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Recent executions
          </h2>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading && recent.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-md bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No executions yet. Runs will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border -mx-1">
          {recent.map((log) => {
            const name =
              log.agentName ||
              log.endpoint ||
              `Log ${log.id.slice(0, 8)}`;
            const tokens = log.usage?.total_tokens;
            const cost = log.usage?.total_cost;
            return (
              <li key={log.id} className="px-1">
                <Link
                  href="/history"
                  className="flex items-center gap-3 py-2.5 group"
                >
                  {log.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm text-foreground truncate font-medium group-hover:text-accent transition-colors">
                      {name}
                    </span>
                    {log.endpoint && log.agentName && (
                      <span className="text-[11px] text-muted-foreground font-mono truncate hidden sm:inline">
                        {log.endpoint}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
                    {typeof cost === 'number' && (
                      <span className="text-foreground font-medium">
                        ${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(2)}
                      </span>
                    )}
                    {typeof tokens === 'number' && (
                      <span className="hidden sm:inline">
                        {tokens.toLocaleString()} tok
                      </span>
                    )}
                    <span>{formatRelative(log.timestamp)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatRelative(timestamp: string | null): string {
  if (!timestamp) return '—';
  const t = new Date(timestamp).getTime();
  if (!Number.isFinite(t)) return '—';
  const diff = Date.now() - t;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
