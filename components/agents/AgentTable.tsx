'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAgents } from '@/lib/hooks/useAgents';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Agent } from '@/types/agent';
import { formatSpend } from '@/lib/utils/currency';
import {
  Play,
  Edit,
  Trash2,
  Copy,
  Plus,
  ChevronsUpDown,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AgentSpendStats {
  runCount: number;
  totalSpend: number;
  lastRunAt: string | null;
}

interface AgentTableProps {
  agents?: Agent[];
  agentStats?: Record<string, AgentSpendStats>;
  onCreateAgent?: () => void;
  onEditAgent?: (agent: Agent) => void;
  onExecuteAgent?: (agent: Agent) => void;
  showCreateButton?: boolean;
}

export function AgentTable({
  agents: providedAgents,
  agentStats = {},
  onCreateAgent,
  onEditAgent,
  onExecuteAgent,
  showCreateButton = true,
}: AgentTableProps) {
  const { agents: hookAgents, removeAgent, duplicateAgent } = useAgents();
  const agents = providedAgents ?? hookAgents;
  const [sortBy, setSortBy] = useState<
    'name' | 'created_at' | 'status' | 'runs' | 'spend'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedAgents = [...agents].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.config.agent_name.localeCompare(b.config.agent_name);
    } else if (sortBy === 'created_at') {
      comparison =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === 'runs') {
      const ra = agentStats[a.config.agent_name]?.runCount ?? 0;
      const rb = agentStats[b.config.agent_name]?.runCount ?? 0;
      comparison = ra - rb;
    } else if (sortBy === 'spend') {
      const sa = agentStats[a.config.agent_name]?.totalSpend ?? 0;
      const sb = agentStats[b.config.agent_name]?.totalSpend ?? 0;
      comparison = sa - sb;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: 'name' | 'created_at' | 'status' | 'runs' | 'spend') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'spend' ? 'desc' : 'asc');
    }
  };

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-subtle/50 p-10">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
          No agents yet
        </h3>
        <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
          Create your first agent to begin orchestrating multi-agent workflows.
        </p>
        <Button variant="primary" size="md" onClick={onCreateAgent}>
          <Plus className="w-3.5 h-3.5" />
          Create agent
        </Button>
      </div>
    );
  }

  const sortBtn =
    'inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors';
  const actionBtn =
    'p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {showCreateButton && (
        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={onCreateAgent}>
            <Plus className="w-3.5 h-3.5" />
            New agent
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                <th className="px-4 h-10 text-left whitespace-nowrap">
                  <button type="button" onClick={() => toggleSort('status')} className={sortBtn}>
                    Status
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 h-10 text-left whitespace-nowrap">
                  <button type="button" onClick={() => toggleSort('name')} className={sortBtn}>
                    Name
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden md:table-cell">
                  Model
                </th>
                <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                  Role
                </th>
                <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                  Temp
                </th>
                <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                  Loops
                </th>
                <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden md:table-cell">
                  Max tokens
                </th>
                <th className="px-4 h-10 text-right whitespace-nowrap hidden md:table-cell">
                  <button type="button" onClick={() => toggleSort('runs')} className={sortBtn}>
                    Runs
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 h-10 text-right whitespace-nowrap">
                  <button type="button" onClick={() => toggleSort('spend')} className={sortBtn}>
                    Total spend
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent) => {
                const stats = agentStats[agent.config.agent_name];
                const runCount = stats?.runCount ?? 0;
                const totalSpend = stats?.totalSpend ?? 0;
                const hasRuns = runCount > 0;
                const avgCost = hasRuns ? totalSpend / runCount : 0;
                const tooltipLines = [
                  `Runs: ${runCount.toLocaleString()}`,
                  `Avg cost: ${formatSpend(avgCost)}`,
                  stats?.lastRunAt
                    ? `Last run: ${new Date(stats.lastRunAt).toLocaleString()}`
                    : 'Never run',
                ];
                const tooltip = tooltipLines.join('\n');

                return (
                  <tr
                    key={agent.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AgentStatusIndicator status={agent.status} showLabel />
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div
                        className="text-sm text-foreground truncate max-w-[200px]"
                        title={agent.config.agent_name}
                      >
                        {agent.config.agent_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">
                        {agent.config.model_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-muted-foreground">
                        {agent.config.role || 'worker'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <div className="font-mono text-xs text-foreground tabular-nums">
                        {agent.config.temperature ?? 0.5}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <div className="font-mono text-xs text-foreground tabular-nums">
                        {agent.config.max_loops ?? 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <div className="font-mono text-xs text-muted-foreground tabular-nums">
                        {agent.config.max_tokens ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <Link
                        href={`/history?search=${encodeURIComponent(agent.config.agent_name)}`}
                        className="group inline-block"
                        title={tooltip}
                      >
                        <span className="font-mono text-xs text-muted-foreground tabular-nums group-hover:text-accent group-hover:underline">
                          {hasRuns ? runCount.toLocaleString() : '—'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/history?search=${encodeURIComponent(agent.config.agent_name)}`}
                        className="group inline-block"
                        title={tooltip}
                      >
                        <span className="font-mono text-xs text-foreground tabular-nums group-hover:text-accent group-hover:underline">
                          {hasRuns ? formatSpend(totalSpend) : '—'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => onExecuteAgent?.(agent)}
                          className={actionBtn}
                          title="Execute"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditAgent?.(agent)}
                          className={actionBtn}
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateAgent(agent.id)}
                          className={actionBtn}
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAgent(agent.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
