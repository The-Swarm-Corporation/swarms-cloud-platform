'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import {
  metaFor,
  displaySwarmName,
  swarmHref,
  SWARM_CATEGORY_LABEL,
  SWARM_CATEGORY_TONE,
  buildSwarmPayload,
  buildSwarmFaqs,
  recommendedSwarmTypes,
  benchmarkLatencyLabel,
  benchmarkCostLabel,
} from '@/lib/swarms/catalog';
import { SwarmType } from '@/types/api';
import {
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  FileText,
  FlaskConical,
  KeyRound,
  TerminalSquare,
  Zap,
} from 'lucide-react';

// TEMP-FIX: dynamic import of mermaid so we can render Mermaid diagrams on the
// client. Revert to a static topology component if bundle size becomes an issue.
let mermaidInitPromise: Promise<typeof import('mermaid')> | null = null;
function loadMermaid() {
  if (!mermaidInitPromise) {
    mermaidInitPromise = import('mermaid').then((mermaid) => {
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'strict',
        fontSize: 12,
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          rankSpacing: 24,
          nodeSpacing: 12,
          useMaxWidth: true,
        },
      });
      return mermaid;
    });
  }
  return mermaidInitPromise;
}

const ENV_SNIPPET = `# .env
SWARMS_API_KEY="your-api-key"

# or export it in your shell
export SWARMS_API_KEY="your-api-key"`;

function CopyButton({
  text,
  label,
  className = '',
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 ${className}`}
      aria-label={label}
      title={label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function StepCard({
  step,
  title,
  icon,
  children,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-6 h-6 rounded-full bg-subtle border border-border text-[11px] font-semibold text-muted-foreground inline-flex items-center justify-center tabular-nums flex-shrink-0">
          {step}
        </span>
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function buildMermaidDefinition(typeId: string, roles: { name: string; role: string }[]): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
  const ids = roles.map((_, i) => `A${i}`);

  switch (typeId) {
    case 'SequentialWorkflow':
      return `flowchart LR\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n${ids.slice(1).map((id, i) => `    A${i} --> ${id}`).join('\n')}`;
    case 'ConcurrentWorkflow':
    case 'BatchedGridWorkflow':
      return `flowchart TB\n    Task(["Task"])\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Task --> ${ids.join('\n    Task --> ')}\n${ids.map((id) => `    ${id} --> Out(["Outputs"])`).join('\n')}`;
    case 'MixtureOfAgents':
      return `flowchart TB\n    Task(["Task"])\n${ids.slice(0, -1).map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Agg["${safe(roles[roles.length - 1].name)}"]\n    Task --> ${ids.slice(0, -1).join('\n    Task --> ')}\n${ids.slice(0, -1).map((id) => `    ${id} --> Agg`).join('\n')}`;
    case 'GroupChat':
      return `flowchart LR\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n${ids.map((id, i) => {
        const next = ids[(i + 1) % ids.length];
        return `    ${id} <--> ${next}`;
      }).join('\n')}`;
    case 'MultiAgentRouter':
      return `flowchart TB\n    Task(["Task"])\n    Router["Router"]\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Task --> Router\n    Router --> ${ids.join('\n    Router --> ')}`;
    case 'HierarchicalSwarm':
    case 'PlannerWorkerSwarm':
      return `flowchart TB\n    Director["${safe(roles[0].name)}"]\n${ids.slice(1).map((id, i) => `    ${id}["${safe(roles[i + 1].name)}"]`).join('\n')}\n    Director --> ${ids.slice(1).join('\n    Director --> ')}\n${ids.slice(1).map((id) => `    ${id} --> Director`).join('\n')}`;
    case 'MajorityVoting':
      return `flowchart TB\n    Task(["Task"])\n${ids.slice(0, -1).map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Vote["${safe(roles[roles.length - 1].name)}"]\n    Task --> ${ids.slice(0, -1).join('\n    Task --> ')}\n${ids.slice(0, -1).map((id) => `    ${id} --> Vote`).join('\n')}`;
    case 'CouncilAsAJudge':
      return `flowchart TB\n    Response(["Response"])\n${ids.slice(0, -1).map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Agg["${safe(roles[roles.length - 1].name)}"]\n    Response --> ${ids.slice(0, -1).join('\n    Response --> ')}\n${ids.slice(0, -1).map((id) => `    ${id} --> Agg`).join('\n')}`;
    case 'LLMCouncil':
      return `flowchart LR\n    Task(["Task"])\n${ids.slice(0, -1).map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Chair["${safe(roles[roles.length - 1].name)}"]\n    Task --> ${ids.slice(0, -1).join('\n    Task --> ')}\n${ids.slice(0, -1).map((id) => `    ${id} --> Chair`).join('\n')}`;
    case 'DebateWithJudge':
      return `flowchart TB\n    Topic(["Topic"])\n    Pro["${safe(roles[0].name)}"]\n    Con["${safe(roles[1].name)}"]\n    Judge["${safe(roles[2].name)}"]\n    Topic --> Pro\n    Topic --> Con\n    Pro --> Judge\n    Con --> Judge`;
    case 'RoundRobin':
      return `flowchart LR\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n${ids.map((id, i) => {
        const next = ids[(i + 1) % ids.length];
        return `    ${id} -->|turn| ${next}`;
      }).join('\n')}`;
    case 'AgentRearrange':
      return `flowchart LR\n    In(["Input"])\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Out(["Output"])\n    In --> ${ids[0]}\n${ids.slice(0, -1).map((id, i) => `    ${id} --> ${ids[i + 1]}`).join('\n')}\n    ${ids[ids.length - 1]} --> Out`;
    case 'AutoSwarmBuilder':
    case 'auto':
    case 'HeavySwarm':
    default:
      return `flowchart TB\n    Task(["Task"])\n${ids.map((id, i) => `    ${id}["${safe(roles[i].name)}"]`).join('\n')}\n    Task --> ${ids.join('\n    Task --> ')}`;
  }
}

function MermaidDiagram({ definition }: { definition: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadMermaid().then((mermaid) => {
      if (cancelled || !containerRef.current) return;
      mermaid.default.run({
        nodes: [containerRef.current],
        suppressErrors: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [definition]);

  return (
    <div ref={containerRef} className="mermaid text-xs">
      {definition}
    </div>
  );
}

function ArchitectureDiagram({ typeId }: { typeId: string }) {
  const meta = metaFor(typeId);
  const roles = meta.agentRoles.slice(0, 5);
  const Icon = meta.icon;

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="w-4 h-4" />
          {meta.label}
        </div>
      </div>
    );
  }

  const definition = buildMermaidDefinition(typeId, roles);

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Agent topology</h3>
      </div>
      <div className="overflow-x-auto">
        <MermaidDiagram definition={definition} />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Typical agent layout for a {meta.label} run. Actual execution follows the
        architecture-specific flow.
      </p>
    </div>
  );
}

function AtAGlanceTable({ typeId }: { typeId: string }) {
  const meta = metaFor(typeId);
  const bm = meta.benchmark;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Best for', value: meta.whenToUse[0] ?? 'General orchestration' },
    { label: 'Complexity', value: meta.complexity },
    { label: 'Typical agents', value: `${Math.max(2, meta.agentRoles.length)}–${Math.max(3, meta.agentRoles.length + 2)}` },
    { label: 'Latency profile', value: meta.category === 'workflow' && meta.label !== 'Concurrent Workflow' ? 'Sequential (agents run in order)' : meta.category === 'workflow' ? 'Parallel (agents run together)' : meta.category === 'judgment' ? 'Moderate (evaluation rounds)' : 'Variable (depends on loops)' },
    { label: 'Cost profile', value: meta.complexity === 'High' ? 'Higher (more calls / loops)' : meta.complexity === 'Medium' ? 'Moderate' : 'Lower (fewer agents)' },
    { label: 'Endpoint', value: meta.endpoint ?? '/v1/swarm/completions' },
  ];

  if (bm) {
    const taskChips = bm.correctTasks.length > 0
      ? bm.correctTasks.join(', ')
      : 'none';
    rows.push({
      label: 'Benchmark accuracy',
      value: `${(bm.accuracy * 100).toFixed(0)}% (${taskChips})`,
    });
    rows.push({
      label: 'Benchmark model',
      value: bm.model,
    });
    if (bm.latencyS > 0) {
      const latencyLabel = benchmarkLatencyLabel(typeId);
      rows.push({
        label: 'Avg. latency',
        value: `${bm.latencyS.toFixed(2)} s${latencyLabel ? ` (${latencyLabel})` : ''}`,
      });
    }
    if (bm.costUsd > 0) {
      const costLabel = benchmarkCostLabel(typeId);
      rows.push({
        label: 'Avg. cost',
        value: `$${bm.costUsd.toFixed(6)}${costLabel ? ` (${costLabel})` : ''}`,
      });
    }
    if (bm.totalTokens > 0) {
      rows.push({
        label: 'Avg. tokens',
        value: bm.totalTokens.toLocaleString(),
      });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={idx !== rows.length - 1 ? 'border-b border-border' : ''}
            >
              <td className="px-4 py-2.5 w-1/3 text-xs font-medium text-muted-foreground bg-subtle/40">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-xs text-foreground">
                {row.label === 'Endpoint' ? (
                  <code className="font-mono">{row.value}</code>
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SwarmDetailClient({ typeId }: { typeId: string }) {
  const meta = metaFor(typeId);
  const displayName = displaySwarmName(typeId);
  const Icon = meta.icon;
  const categoryLabel = SWARM_CATEGORY_LABEL[meta.category];
  const categoryTone = SWARM_CATEGORY_TONE[meta.category];

  const payload = useMemo(() => buildSwarmPayload(typeId), [typeId]);
  const endpoint = meta.endpoint ?? '/v1/swarm/completions';
  const method = 'POST' as const;
  const listPayload = useMemo(() => ({}), []);
  const faqs = useMemo(() => buildSwarmFaqs(typeId), [typeId]);
  const recommended = useMemo(
    () => recommendedSwarmTypes(typeId, 3),
    [typeId]
  );

  const playgroundHref = `/playground?swarmType=${encodeURIComponent(typeId)}`;

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-5xl mx-auto w-full">
          <Link
            href="/swarms"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All swarm types
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <code className="text-xs font-mono text-muted-foreground">
                    {typeId}
                  </code>
                  <CopyButton text={typeId} label="Copy swarm type" />
                  <span
                    className={`inline-flex items-center px-1.5 h-5 rounded-sm text-[10px] font-medium border ${categoryTone}`}
                  >
                    {categoryLabel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                  {meta.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={playgroundHref}
                className="inline-flex items-center gap-1.5 justify-center h-9 px-4 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80 border border-foreground transition-colors flex-shrink-0"
              >
                <FlaskConical className="w-4 h-4" />
                Open in Playground
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            <ArchitectureDiagram typeId={typeId} />
            <AtAGlanceTable typeId={typeId} />
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
              Architecture overview
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {meta.longDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  When to use
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {meta.whenToUse.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Key features
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {meta.keyFeatures.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {meta.apiNotes && (
              <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm text-foreground">
                <span className="font-medium">API note:</span>{' '}
                <span className="text-muted-foreground">{meta.apiNotes}</span>
              </div>
            )}
            {meta.premium && (
              <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-sm text-foreground mt-3">
                <span className="font-medium">Premium feature:</span>{' '}
                <span className="text-muted-foreground">
                  This endpoint is restricted to Pro, Ultra, and Premium plan
                  subscribers.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <p className="text-xs text-muted-foreground">Quick start</p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Get started with {displayName}
            </h2>
          </div>

          <div className="flex flex-col gap-4 mb-10">
            <StepCard
              step={1}
              title="Get your Swarms API key"
              icon={<KeyRound className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground">
                Create an API key from your{' '}
                <Link
                  href="/api-keys"
                  className="text-accent hover:underline"
                >
                  API keys dashboard
                </Link>{' '}
                or at{' '}
                <a
                  href="https://swarms.world/platform/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  swarms.world/platform/api-keys
                </a>
                .
              </p>
            </StepCard>

            <StepCard
              step={2}
              title="Set it in your environment"
              icon={<TerminalSquare className="w-4 h-4" />}
            >
              <div className="relative">
                <pre className="p-3 rounded-md bg-subtle border border-border overflow-x-auto text-[12px] leading-relaxed text-foreground font-mono">
                  {ENV_SNIPPET}
                </pre>
                <CopyButton
                  text={ENV_SNIPPET}
                  label="Copy environment setup"
                  className="absolute top-2 right-2"
                />
              </div>
            </StepCard>

            <StepCard
              step={3}
              title="List available swarm types"
              icon={<Zap className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Confirm <code className="text-xs font-mono">{typeId}</code> is
                returned by the Swarm Types endpoint before you run it.
              </p>
              <SnippetPreview
                endpoint="/v1/swarms/available"
                method="GET"
                payload={listPayload}
                title="Available swarm types"
              />
            </StepCard>

            <StepCard
              step={4}
              title={`Run a ${displayName} swarm`}
              icon={<Cpu className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Send the configured SwarmSpec to{' '}
                <code className="text-xs font-mono">{endpoint}</code>.
              </p>
              <SnippetPreview
                endpoint={endpoint}
                method={method}
                payload={payload}
                title={`${displayName} example`}
              />
            </StepCard>

            <StepCard
              step={5}
              title="Grab these docs as Markdown"
              icon={<FileText className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Copy the quick-start snippet above, or build your own Markdown
                export from the same payload shown in Step 4.
              </p>
              <div className="relative">
                <pre className="p-3 rounded-md bg-subtle border border-border overflow-x-auto text-[12px] leading-relaxed text-foreground font-mono">
                  curl -s https://api.swarms.world/v1/swarms/available -H
                  &quot;x-api-key: $SWARMS_API_KEY&quot;
                </pre>
                <CopyButton
                  text={`curl -s https://api.swarms.world/v1/swarms/available -H "x-api-key: $SWARMS_API_KEY"`}
                  label="Copy curl command"
                  className="absolute top-2 right-2"
                />
              </div>
            </StepCard>
          </div>

          <div className="border-t border-border pt-6 mb-10">
            <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4">
              Frequently asked questions
            </h2>
            <div className="flex flex-col gap-4">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-3xl">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {recommended.length > 0 && (
            <div className="border-t border-border pt-6">
              <h2 className="text-sm font-semibold tracking-tight text-foreground mb-3">
                More swarm types to try
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommended.map((id) => {
                  const recMeta = metaFor(id);
                  const RecIcon = recMeta.icon;
                  return (
                    <Link
                      key={id}
                      href={swarmHref(id)}
                      className="group rounded-lg border border-border bg-card p-3 flex items-center gap-2.5 min-w-0 transition-colors hover:border-border-strong hover:bg-muted/40"
                    >
                      <div className="w-7 h-7 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
                        <RecIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {recMeta.label}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">
                          {id}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
