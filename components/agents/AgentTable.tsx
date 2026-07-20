'use client';

import React, { useState } from 'react';
import { useAgents } from '@/lib/hooks/useAgents';
import { AgentConfigPanel } from './AgentConfigPanel';
import { Agent } from '@/types/agent';
import { Play, Edit, Trash2, Copy, Check, Plus, ChevronsUpDown, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AgentTableProps {
  agents?: Agent[];
  onCreateAgent?: () => void;
  onEditAgent?: (agent: Agent) => void;
  onExecuteAgent?: (agent: Agent) => void;
  showCreateButton?: boolean;
  /** Row number to start counting from (e.g. offset for the current page). */
  startIndex?: number;
}

export function AgentTable({
  agents: providedAgents,
  onCreateAgent,
  onEditAgent,
  onExecuteAgent,
  showCreateButton = true,
  startIndex = 0,
}: AgentTableProps) {
  const { agents: hookAgents, removeAgent } = useAgents();
  const agents = providedAgents ?? hookAgents;
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyConfig = async (agent: Agent) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(agent.config, null, 2));
      setCopiedId(agent.id);
      setTimeout(() => setCopiedId((prev) => (prev === agent.id ? null : prev)), 1200);
    } catch {
      // ignore
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.config.agent_name.localeCompare(b.config.agent_name);
    } else if (sortBy === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: 'name' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
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
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                <th className="w-8 px-2 h-10" aria-hidden="true" />
                <th className="px-2 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  #
                </th>
                <th className="px-4 h-10 text-left whitespace-nowrap">
                  <button type="button" onClick={() => toggleSort('name')} className={sortBtn}>
                    Name
                    <ChevronsUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                  Description
                </th>
                <th className="px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden md:table-cell">
                  Model
                </th>
                <th className="px-4 h-10 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent, index) => {
                const isExpanded = expandedId === agent.id;
                return (
                  <React.Fragment key={agent.id}>
                    <tr
                      onClick={() =>
                        setExpandedId((prev) => (prev === agent.id ? null : agent.id))
                      }
                      aria-expanded={isExpanded}
                      className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-2 py-3 text-center">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-muted-foreground transition-transform inline-block ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {startIndex + index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <div
                          className="text-sm text-foreground truncate max-w-[200px]"
                          title={agent.config.agent_name}
                        >
                          {agent.config.agent_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div
                          className="text-xs text-muted-foreground truncate max-w-[280px]"
                          title={agent.config.description || undefined}
                        >
                          {agent.config.description || ' - '}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">
                          {agent.config.model_name}
                        </div>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => handleCopyConfig(agent)}
                            className={actionBtn}
                            title="Copy configuration"
                          >
                            {copiedId === agent.id ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
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
                    {isExpanded && (
                      <tr className="border-b border-border last:border-b-0 bg-subtle/30">
                        {/* colSpan={100} spans however many columns actually render at
                            the current breakpoint; the width-0/min-w-full/overflow-hidden
                            wrapper stops this cell's wide content (raw JSON, code
                            snippets) from ever being used to compute the table's
                            (auto-layout) column widths - without it, other rows'
                            columns get corrupted once this row is expanded. */}
                        <td colSpan={100} className="p-0">
                          <div className="w-0 min-w-full overflow-hidden px-4">
                            <AgentConfigPanel agent={agent} />
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
    </div>
  );
}
