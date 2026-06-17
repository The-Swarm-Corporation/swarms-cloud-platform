'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AgentTable } from '@/components/agents/AgentTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { useAgentConfigsList } from '@/lib/hooks/useAgentConfigsList';
import { useSwarmLogs } from '@/lib/hooks/useSwarmLogs';
import { Agent, AgentConfig } from '@/types/agent';
import { downloadCsv, csvTimestamp } from '@/lib/utils/csv';
import {
  Plus,
  Users,
  Loader2,
  RefreshCw,
  XCircle,
  Download,
} from 'lucide-react';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'worker', label: 'Worker' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'manager', label: 'Manager' },
  { value: 'researcher', label: 'Researcher' },
];

function configToDisplayAgent(config: AgentConfig, idx: number): Agent {
  const id =
    (config as unknown as { id?: string }).id ||
    `${config.agent_name || 'agent'}-${idx}`;
  return {
    id,
    config,
    status: 'idle',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    execution_history: [],
  };
}

export default function AgentsPage() {
  const { configs, isLoading, error, refetch } = useAgentConfigsList();
  const { logs } = useSwarmLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const agents = useMemo(
    () => configs.map((c, i) => configToDisplayAgent(c, i)),
    [configs],
  );

  // Aggregate per-agent USD spend from swarm logs. Only counts when the
  // log has a finite numeric `usage.total_cost`; everything else is skipped
  // silently so partial data never produces `NaN` in the spend cells.
  const spendByAgentName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      const name = log.agentName;
      if (!name) continue;
      const cost = log.usage?.total_cost;
      if (typeof cost === 'number' && Number.isFinite(cost)) {
        map[name] = (map[name] ?? 0) + cost;
      }
    }
    return map;
  }, [logs]);

  // Distinct models actually present in the user's agents — drives the model
  // dropdown so we don't show models they don't use.
  const availableModels = useMemo(() => {
    const set = new Set<string>();
    for (const a of agents) {
      const m = a.config.model_name?.trim();
      if (m) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [agents]);

  // Token-based search: every whitespace-separated term must match somewhere.
  const filteredAgents = useMemo(() => {
    const terms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    return agents.filter((agent) => {
      const c = agent.config;
      if (modelFilter !== 'all' && c.model_name !== modelFilter) return false;
      if (roleFilter !== 'all') {
        const role = (c.role ?? '').toLowerCase();
        if (role !== roleFilter.toLowerCase()) return false;
      }
      if (terms.length === 0) return true;

      const haystack = [
        c.agent_name,
        c.description,
        c.model_name,
        c.role,
        c.system_prompt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return terms.every((t) => haystack.includes(t));
    });
  }, [agents, searchQuery, modelFilter, roleFilter]);

  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, modelFilter, roleFilter]);

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);

  const handleEditAgent = (agent: Agent) => {
    console.log('Edit agent:', agent);
  };

  const handleExecuteAgent = (agent: Agent) => {
    console.log('Execute agent:', agent);
  };

  const handleExportCsv = () => {
    const headers = [
      'agent_name',
      'description',
      'model_name',
      'role',
      'temperature',
      'max_loops',
      'max_tokens',
      'auto_generate_prompt',
      'streaming_on',
    ];
    const rows = filteredAgents.map((a) => [
      a.config.agent_name ?? '',
      a.config.description ?? '',
      a.config.model_name ?? '',
      a.config.role ?? '',
      a.config.temperature ?? '',
      a.config.max_loops ?? '',
      a.config.max_tokens ?? '',
      a.config.auto_generate_prompt ?? '',
      a.config.streaming_on ?? '',
    ]);
    downloadCsv(`agents_${csvTimestamp()}.csv`, headers, rows);
  };

  const hasActiveFilter =
    !!searchQuery.trim() || modelFilter !== 'all' || roleFilter !== 'all';

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          {/* Heading row with count */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground">Agents</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                All agents
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Agent configurations from your Swarms account
                (<code className="text-foreground">/v1/agents/list</code>).
              </p>
            </div>
            {!(isLoading && agents.length === 0) && agents.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap flex-shrink-0 sm:self-end sm:pb-1">
                <span className="text-foreground font-medium">
                  {filteredAgents.length.toLocaleString()}
                </span>{' '}
                of {agents.length.toLocaleString()} agents
              </span>
            )}
          </div>

          {/* Toolbar — only render when there's something to search */}
          {!(isLoading && agents.length === 0) && agents.length > 0 && (
            <div className="mb-5 pb-4 border-b border-border flex flex-col gap-2.5">
              {/* Row 1 — Search + primary actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search agents by name, model, role, prompt…"
                  className="flex-1 min-w-0"
                />
                <div className="flex items-center gap-2">
                  <Link href="/">
                    <Button variant="primary" size="md">
                      <Plus className="w-3.5 h-3.5" />
                      New agent
                    </Button>
                  </Link>
                  {filteredAgents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      aria-label="Export filtered agents as CSV"
                      title={`Export ${filteredAgents.length.toLocaleString()} agent${
                        filteredAgents.length === 1 ? '' : 's'
                      } as CSV`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={refetch}
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

              {/* Row 2 — Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  label="Model"
                  value={modelFilter}
                  onChange={setModelFilter}
                  options={[
                    { value: 'all', label: 'All models' },
                    ...availableModels.map((m) => ({ value: m, label: m })),
                  ]}
                />
                <FilterSelect
                  label="Role"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={ROLE_OPTIONS}
                />
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setModelFilter('all');
                      setRoleFilter('all');
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading && agents.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading agent configurations…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : agents.length === 0 ? (
            <EmptyState
              title="No agents yet"
              description="Create your first agent to begin orchestration."
              showCta
            />
          ) : filteredAgents.length === 0 ? (
            <EmptyState
              title="No agents match"
              description="Try a different search or clear the filters."
            />
          ) : (
            <>
              <AgentTable
                agents={paginatedAgents}
                spendByAgentName={spendByAgentName}
                onEditAgent={handleEditAgent}
                onExecuteAgent={handleExecuteAgent}
                showCreateButton={false}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAgents.length}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
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
  showCta,
}: {
  title: string;
  description: string;
  showCta?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-subtle/50 p-10">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
        {description}
      </p>
      {showCta && (
        <Link href="/">
          <Button variant="primary" size="md">
            <Plus className="w-3.5 h-3.5" />
            Create agent
          </Button>
        </Link>
      )}
    </div>
  );
}
