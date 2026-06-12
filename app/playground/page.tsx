'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import { AgentConfigsTable } from '@/components/agents/AgentConfigsTable';
import { AgentSpecCard } from '@/components/playground/AgentSpecCard';
import { SwarmOutput } from '@/components/playground/SwarmOutput';
import { useUIStore } from '@/lib/store/ui-store';
import { AgentConfig } from '@/types/agent';
import {
  SwarmAgentSpec,
  SwarmSpec,
  SwarmCompletion,
  SWARM_TYPES,
  SWARM_TYPE_DESCRIPTIONS,
  SwarmType,
} from '@/types/api';
import {
  Plus,
  Play,
  Loader2,
  XCircle,
  Sparkles,
  Download,
  ImageIcon,
} from 'lucide-react';

function makeBlankAgent(index: number): SwarmAgentSpec {
  return {
    agent_name: `Agent ${index + 1}`,
    model_name: 'gpt-5.4',
    role: 'worker',
    system_prompt: '',
    temperature: 0.7,
    max_loops: 1,
    max_tokens: 8192,
  };
}

function configToAgentSpec(config: AgentConfig): SwarmAgentSpec {
  return {
    agent_name: config.agent_name,
    description: config.description,
    system_prompt: config.system_prompt,
    model_name: config.model_name,
    role: config.role,
    max_loops:
      typeof config.max_loops === 'number' ? config.max_loops : 1,
    max_tokens: config.max_tokens,
    temperature: config.temperature,
  };
}

const fieldLabel =
  'text-[11px] font-medium text-muted-foreground uppercase tracking-wider';
const inputBase =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function PlaygroundPage() {
  const addToast = useUIStore((s) => s.addToast);
  const searchParams = useSearchParams();
  const initialType = (() => {
    const param = searchParams?.get('type');
    return param && (SWARM_TYPES as readonly string[]).includes(param)
      ? (param as SwarmType)
      : 'SequentialWorkflow';
  })();

  const [swarmName, setSwarmName] = useState('Untitled Swarm');
  const [swarmType, setSwarmType] = useState<SwarmType>(initialType);
  const [task, setTask] = useState('');
  const [rules, setRules] = useState('');
  const [maxLoops, setMaxLoops] = useState(1);
  const [rearrangeFlow, setRearrangeFlow] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [agents, setAgents] = useState<SwarmAgentSpec[]>([
    {
      ...makeBlankAgent(0),
      agent_name: 'Researcher',
      system_prompt:
        'You research the topic deeply and provide structured findings.',
    },
    {
      ...makeBlankAgent(1),
      agent_name: 'Writer',
      system_prompt:
        'You take the research and craft a clear, well-structured response.',
    },
  ]);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SwarmCompletion | null>(null);

  const [isImportOpen, setIsImportOpen] = useState(false);

  const updateAgent = (idx: number, next: SwarmAgentSpec) => {
    setAgents((prev) => prev.map((a, i) => (i === idx ? next : a)));
  };

  const addAgent = () => {
    setAgents((prev) => {
      const next = [...prev, makeBlankAgent(prev.length)];
      setExpandedAgent(next.length - 1);
      return next;
    });
  };

  const removeAgent = (idx: number) => {
    setAgents((prev) => prev.filter((_, i) => i !== idx));
    setExpandedAgent((cur) => (cur === idx ? null : cur));
  };

  const importConfig = (config: AgentConfig) => {
    const spec = configToAgentSpec(config);
    setAgents((prev) => {
      const next = [...prev, spec];
      setExpandedAgent(next.length - 1);
      return next;
    });
    setIsImportOpen(false);
    addToast({
      type: 'success',
      message: `Added ${config.agent_name} to swarm`,
      duration: 2500,
    });
  };

  const canRun =
    !isRunning && task.trim().length > 0 && agents.length > 0;

  const buildSpec = (): SwarmSpec => ({
    name: swarmName.trim() || undefined,
    swarm_type: swarmType,
    task: task.trim(),
    rules: rules.trim() || undefined,
    max_loops: maxLoops,
    agents,
    ...(swarmType === 'AgentRearrange' && rearrangeFlow.trim()
      ? { rearrange_flow: rearrangeFlow.trim() }
      : {}),
    ...(imgUrl.trim() ? { img: imgUrl.trim() } : {}),
  });

  // Mirror the exact payload the server will POST so the snippet preview
  // updates as you edit the form.
  const previewSpec = useMemo<SwarmSpec>(
    () => buildSpec(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swarmName, swarmType, task, rules, maxLoops, agents, rearrangeFlow, imgUrl]
  );

  const run = async () => {
    if (!task.trim()) {
      addToast({
        type: 'error',
        message: 'Task is required',
        duration: 3000,
      });
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    const spec: SwarmSpec = buildSpec();

    try {
      const res = await fetch('/api/swarm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spec),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setResult(data as SwarmCompletion);
      addToast({
        type: 'success',
        message: 'Swarm completed',
        duration: 2500,
      });
    } catch (e: any) {
      const message = e?.message || 'Failed to run swarm';
      setError(message);
      addToast({ type: 'error', message, duration: 5000 });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          {/* Page header */}
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Build</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Playground
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Compose multiple agents into a swarm, choose how they collaborate,
              and watch them talk to each other.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* LEFT — config column */}
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Swarm
                  </h2>
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Name</label>
                    <input
                      type="text"
                      value={swarmName}
                      onChange={(e) => setSwarmName(e.target.value)}
                      maxLength={100}
                      className={inputBase}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Type</label>
                    <select
                      value={swarmType}
                      onChange={(e) =>
                        setSwarmType(e.target.value as SwarmType)
                      }
                      className={inputBase}
                    >
                      {SWARM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {SWARM_TYPE_DESCRIPTIONS[swarmType] ?? ''}
                </p>

                {swarmType === 'AgentRearrange' && (
                  <Textarea
                    label="Rearrange flow"
                    value={rearrangeFlow}
                    onChange={(e) => setRearrangeFlow(e.target.value)}
                    placeholder="e.g. agent1 -> agent2, agent3"
                    rows={2}
                    helperText="Define how agents pass work between each other."
                  />
                )}

                <Textarea
                  label="Task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="What should the swarm accomplish?"
                  rows={4}
                  showCharCount
                  autoFocus
                />

                <Textarea
                  label="Rules (optional)"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Constraints or guidelines the agents must follow…"
                  rows={2}
                />

                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>
                    <span className="inline-flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-muted-foreground" />
                      Image URL (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="https://example.com/diagram.png"
                    className={inputBase}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Sent as the top-level <code className="text-foreground">img</code> field. Use a publicly reachable URL.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Max loops</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxLoops}
                      onChange={(e) =>
                        setMaxLoops(parseInt(e.target.value) || 1)
                      }
                      className={inputBase}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Agents</label>
                    <div className="h-9 px-3 rounded-md border border-border bg-subtle text-sm text-foreground font-mono tabular-nums flex items-center">
                      {agents.length}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Agents
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsImportOpen(true)}
                      title="Import from saved configurations"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Import</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={addAgent}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add agent</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {agents.map((agent, i) => (
                    <AgentSpecCard
                      key={i}
                      index={i}
                      agent={agent}
                      onChange={(next) => updateAgent(i, next)}
                      onRemove={() => removeAgent(i)}
                      canRemove={agents.length > 1}
                      expanded={expandedAgent === i}
                      onToggleExpand={() =>
                        setExpandedAgent((cur) => (cur === i ? null : i))
                      }
                    />
                  ))}
                </div>
              </section>

              <div className="sticky bottom-4 z-10">
                <div className="rounded-lg border border-border bg-card/95 backdrop-blur p-3 flex items-center justify-between gap-3 shadow-sm">
                  <div className="text-xs text-muted-foreground min-w-0 truncate">
                    {!task.trim()
                      ? 'Add a task to run the swarm.'
                      : `Ready: ${agents.length} agent${
                          agents.length === 1 ? '' : 's'
                        } · ${swarmType}`}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={run}
                    disabled={!canRun}
                    isLoading={isRunning}
                  >
                    {!isRunning && <Play className="w-3.5 h-3.5" />}
                    {isRunning ? 'Running…' : 'Run swarm'}
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT — output column */}
            <div className="space-y-5">
              {isRunning && (
                <div className="rounded-lg border border-border bg-card p-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Running {agents.length} agent
                    {agents.length === 1 ? '' : 's'} as {swarmType}…
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This can take a moment.
                  </p>
                </div>
              )}

              {!isRunning && error && (
                <div className="rounded-lg border border-danger/40 bg-danger/5 p-4 sm:p-5">
                  <div className="flex items-start gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold text-foreground">
                      Run failed
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 ml-6 break-words">
                    {error}
                  </p>
                </div>
              )}

              {!isRunning && !error && result && <SwarmOutput result={result} />}

              {!isRunning && !error && !result && (
                <div className="rounded-lg border border-dashed border-border bg-subtle/50 p-10 text-center">
                  <Sparkles className="w-5 h-5 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Nothing yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Configure the swarm and your agents on the left, then click{' '}
                    <span className="font-medium text-foreground">Run swarm</span>{' '}
                    to see them collaborate.
                  </p>
                </div>
              )}

              <SnippetPreview
                endpoint="/v1/swarm/completions"
                method="POST"
                payload={previewSpec}
                title="Request preview"
              />
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import saved configuration"
        size="large"
      >
        <AgentConfigsTable onSelectConfig={importConfig} />
      </Modal>
    </div>
  );
}
