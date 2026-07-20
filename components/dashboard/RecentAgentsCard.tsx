'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { SwarmLogEntry } from '@/lib/hooks/useSwarmLogs';
import type { AgentConfig } from '@/types/agent';
import { Bot, CheckCircle2, XCircle } from 'lucide-react';

type RecentAgent = {
  name: string;
  lastCallAt: number | null;
  callCount: number;
  lastSuccess: boolean;
  model: string | null;
};

interface RecentAgentsCardProps {
  logs: SwarmLogEntry[];
  configs: AgentConfig[];
  isLoading?: boolean;
}

export function RecentAgentsCard({
  logs,
  configs,
  isLoading: logsLoading = false,
}: RecentAgentsCardProps) {

  const recent: RecentAgent[] = useMemo(() => {
    const modelByName = new Map(
      configs.map((c) => [c.agent_name, c.model_name])
    );

    const byName = new Map<string, RecentAgent>();
    for (const log of logs) {
      const name = log.agentName?.trim();
      if (!name) continue;
      const t = log.timestamp ? new Date(log.timestamp).getTime() : null;

      const existing = byName.get(name);
      if (!existing) {
        byName.set(name, {
          name,
          lastCallAt: Number.isFinite(t) ? t : null,
          callCount: 1,
          lastSuccess: log.success,
          model: modelByName.get(name) ?? null,
        });
      } else {
        existing.callCount += 1;
        if (
          Number.isFinite(t) &&
          (existing.lastCallAt === null || (t as number) > existing.lastCallAt)
        ) {
          existing.lastCallAt = t as number;
          existing.lastSuccess = log.success;
        }
      }
    }

    return Array.from(byName.values())
      .sort((a, b) => (b.lastCallAt ?? 0) - (a.lastCallAt ?? 0))
      .slice(0, 8);
  }, [logs, configs]);

  const totalCalls = logs.length;

  return (
    <section className="rounded-lg border border-border bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Agents Called Recently
          </h2>
        </div>
        {totalCalls > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {totalCalls} total {totalCalls === 1 ? 'call' : 'calls'}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-[200px]">
        {logsLoading && recent.length === 0 ? (
          <div className="h-24 rounded-md bg-muted/30 animate-pulse" />
        ) : recent.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Agents you call will appear here.
          </p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  <th className="text-left font-medium pb-2">Agent</th>
                  <th className="text-left font-medium pb-2 hidden sm:table-cell">
                    Model
                  </th>
                  <th className="text-right font-medium pb-2 w-16">Calls</th>
                  <th className="text-right font-medium pb-2 w-20">Last</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr
                    key={a.name}
                    className="border-t border-border hover:bg-subtle/50 transition-colors"
                  >
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.lastSuccess ? (
                          <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-danger flex-shrink-0" />
                        )}
                        <span className="text-sm text-foreground truncate">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 hidden sm:table-cell">
                      <span className="text-muted-foreground font-mono text-[11px] truncate">
                        {a.model ?? ' - '}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">
                      {a.callCount}
                    </td>
                    <td className="py-2 pl-2 text-right tabular-nums text-muted-foreground">
                      {formatRelative(a.lastCallAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-border text-center">
        <Link href="/agents" className="text-xs text-accent hover:underline">
          View all agents
        </Link>
      </div>
    </section>
  );
}

function formatRelative(timestamp: number | null): string {
  if (timestamp === null) return ' - ';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
