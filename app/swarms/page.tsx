'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { apiFetch } from '@/lib/api/client-fetch';
import {
  Network,
  Loader2,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  ArrowRightLeft,
  Layers,
  ListOrdered,
  GitBranch,
  MessageSquare,
  Route,
  Wand2,
  Workflow,
  Sparkles,
  Vote,
  Scale,
  Boxes,
  Grid3x3,
  Users,
  Gavel,
  RotateCw,
  ClipboardList,
  Cpu,
} from 'lucide-react';

type SwarmTypeMeta = {
  label: string;
  description: string;
  category: 'collaboration' | 'workflow' | 'routing' | 'judgment' | 'auto';
  icon: React.ComponentType<{ className?: string }>;
};

const SWARM_TYPE_META: Record<string, SwarmTypeMeta> = {
  AgentRearrange: {
    label: 'Agent Rearrange',
    description:
      'Dynamically reorders agent execution based on the task topology you define.',
    category: 'workflow',
    icon: ArrowRightLeft,
  },
  MixtureOfAgents: {
    label: 'Mixture of Agents',
    description:
      'Multiple specialist agents contribute in parallel, then an aggregator synthesizes the answer.',
    category: 'collaboration',
    icon: Layers,
  },
  SequentialWorkflow: {
    label: 'Sequential Workflow',
    description:
      'Agents run one after another, each receiving the previous agent’s output as input.',
    category: 'workflow',
    icon: ListOrdered,
  },
  ConcurrentWorkflow: {
    label: 'Concurrent Workflow',
    description:
      'All agents run in parallel on the same task; outputs are returned together.',
    category: 'workflow',
    icon: GitBranch,
  },
  GroupChat: {
    label: 'Group Chat',
    description:
      'Agents participate in a multi-turn group conversation to reach a shared conclusion.',
    category: 'collaboration',
    icon: MessageSquare,
  },
  MultiAgentRouter: {
    label: 'Multi-Agent Router',
    description:
      'A router agent dispatches each task to the most appropriate specialist agent.',
    category: 'routing',
    icon: Route,
  },
  AutoSwarmBuilder: {
    label: 'Auto Swarm Builder',
    description:
      'Generates an agent configuration automatically from a high-level task description.',
    category: 'auto',
    icon: Wand2,
  },
  HierarchicalSwarm: {
    label: 'Hierarchical Swarm',
    description:
      'A director agent decomposes the task and supervises a team of worker agents.',
    category: 'collaboration',
    icon: Workflow,
  },
  auto: {
    label: 'Auto',
    description:
      'Lets the API select the best swarm architecture for the supplied task.',
    category: 'auto',
    icon: Sparkles,
  },
  MajorityVoting: {
    label: 'Majority Voting',
    description:
      'Multiple agents answer the same question; the majority answer wins.',
    category: 'judgment',
    icon: Vote,
  },
  CouncilAsAJudge: {
    label: 'Council as a Judge',
    description:
      'A council of agents reviews and rates candidate answers, returning a verdict.',
    category: 'judgment',
    icon: Scale,
  },
  HeavySwarm: {
    label: 'Heavy Swarm',
    description:
      'Large parallel deployment of agents for maximum throughput and coverage.',
    category: 'collaboration',
    icon: Boxes,
  },
  BatchedGridWorkflow: {
    label: 'Batched Grid Workflow',
    description:
      'Runs a matrix of agent-task combinations as a batched grid execution.',
    category: 'workflow',
    icon: Grid3x3,
  },
  LLMCouncil: {
    label: 'LLM Council',
    description:
      'A panel of LLM-backed agents deliberates and returns a consensus response.',
    category: 'judgment',
    icon: Users,
  },
  DebateWithJudge: {
    label: 'Debate with Judge',
    description:
      'Agents debate opposing positions while a judge agent decides the winner.',
    category: 'judgment',
    icon: Gavel,
  },
  RoundRobin: {
    label: 'Round Robin',
    description:
      'Agents take turns in a fixed rotation, cycling through until the task is solved.',
    category: 'workflow',
    icon: RotateCw,
  },
  PlannerWorkerSwarm: {
    label: 'Planner / Worker Swarm',
    description:
      'A planner agent breaks down the task into steps; worker agents execute each step.',
    category: 'collaboration',
    icon: ClipboardList,
  },
};

const CATEGORY_LABEL: Record<SwarmTypeMeta['category'], string> = {
  collaboration: 'Collaboration',
  workflow: 'Workflow',
  routing: 'Routing',
  judgment: 'Judgment',
  auto: 'Auto',
};

const CATEGORY_TONE: Record<SwarmTypeMeta['category'], string> = {
  collaboration: 'border-accent/30 bg-accent/10 text-accent',
  workflow: 'border-success/30 bg-success/10 text-success',
  routing: 'border-warning/30 bg-warning/10 text-warning',
  judgment: 'border-border-strong bg-muted text-foreground',
  auto: 'border-border-strong bg-subtle text-muted-foreground',
};

function metaFor(typeId: string): SwarmTypeMeta {
  const known = SWARM_TYPE_META[typeId];
  if (known) return known;
  return {
    label: typeId,
    description: 'No description available for this swarm type.',
    category: 'auto',
    icon: Cpu,
  };
}

export default function SwarmsPage() {
  const [types, setTypes] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = refresh ? '/api/swarms?refresh=1' : '/api/swarms';
      const res = await apiFetch(url, { method: 'GET' });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const list: unknown = data?.swarm_types ?? data?.types ?? data;
      const arr = Array.isArray(list)
        ? list.filter((t) => typeof t === 'string')
        : [];
      setTypes(arr as string[]);
      setTimestamp(typeof data?.timestamp === 'string' ? data.timestamp : null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load swarm types');
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return types;
    return types.filter((t) => {
      const meta = metaFor(t);
      return (
        t.toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        meta.category.toLowerCase().includes(q)
      );
    });
  }, [types, query]);

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Catalog</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Swarm types
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Every multi-agent architecture supported by the Swarms API
              (<code className="text-foreground">/v1/swarms/available</code>).
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="px-2 h-6 rounded-md border border-border bg-subtle inline-flex items-center tabular-nums">
                {filtered.length} of {types.length}
              </span>
              {timestamp && (
                <span className="px-2 h-6 rounded-md border border-border bg-subtle inline-flex items-center text-muted-foreground">
                  As of {new Date(timestamp).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 lg:w-80">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search swarm types…"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => load(true)}
                disabled={loading}
                aria-label="Refresh"
                title="Refresh"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {loading && types.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading swarm types…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={() => load(true)}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed border-border bg-subtle/50 p-10">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Network className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
                {types.length === 0 ? 'No swarm types returned' : 'No swarms match'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {types.length === 0
                  ? 'The API returned no swarm types for this account.'
                  : 'Try a different search query.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((typeId) => (
                <SwarmCard
                  key={typeId}
                  typeId={typeId}
                  onCopy={handleCopy}
                  copied={copiedId === typeId}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SwarmCard({
  typeId,
  onCopy,
  copied,
}: {
  typeId: string;
  onCopy: (id: string) => void;
  copied: boolean;
}) {
  const meta = metaFor(typeId);
  const Icon = meta.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {meta.label}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
              {typeId}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCopy(typeId)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Copy swarm type"
          title="Copy swarm type"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {meta.description}
      </p>

      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <span
          className={`inline-flex items-center px-1.5 h-5 rounded-sm text-[10px] font-medium border ${
            CATEGORY_TONE[meta.category]
          }`}
        >
          {CATEGORY_LABEL[meta.category]}
        </span>
      </div>
    </div>
  );
}
