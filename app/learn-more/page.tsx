import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SwarmsMark } from '@/components/auth/BrandMarks';
import { buildMetadata, SITE } from '@/lib/seo';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  FileJson,
  FlaskConical,
  GitBranch,
  Globe,
  Hammer,
  History,
  KeyRound,
  Layers,
  MoonStar,
  Network,
  Package,
  Plug,
  ShieldCheck,
  Sparkles,
  Wand2,
  Workflow,
  Zap,
} from 'lucide-react';

export const metadata = buildMetadata({
  title: 'The Swarms Cloud — Multi-Agent AI Platform',
  description:
    'Build, deploy, and scale multi-agent AI systems with Swarms Cloud. Orchestrate 16 swarm architectures, reasoning agents, and batch workflows through an OpenAI-compatible API. Join 7M+ developers using Swarms.',
  path: '/learn-more',
  keywords: [
    'multi-agent AI platform',
    'Claude agents',
    'GPT agents',
    'agentic AI',
    'AI agent orchestration',
    'batch AI agents',
    'reasoning agents',
    'OpenAI compatible API',
    'hierarchical swarm',
    'sequential workflow',
    'concurrent workflow',
    'what is Swarms',
    'Swarms Cloud overview',
    'multi-agent AI explained',
    'how to build AI agents',
    'deploy multi-agent systems',
    'enterprise agent platform',
    'AI agent use cases',
    'deep research agents',
    'agent tools and MCP',
    'structured output agents',
    'Rust agent runtime',
    'scalable AI infrastructure',
  ],
});

const HERO_STATS = [
  { value: '20+', label: 'API endpoints' },
  { value: '16', label: 'Swarm architectures' },
  { value: '4', label: 'Global regions' },
  { value: '50%', label: 'Night-mode discount' },
];

const CAPABILITIES = [
  {
    icon: Network,
    title: 'Agents & swarms',
    description:
      'Run single agents or orchestrate full swarms — hierarchical, parallel, and collaborative workflows — through one completion API. Batch endpoints handle fleets in a single call.',
  },
  {
    icon: FlaskConical,
    title: 'Advanced research',
    description:
      'Launch deep research sessions that fan out across sources and synthesize findings, individually or in batches.',
  },
  {
    icon: BrainCircuit,
    title: 'Reasoning agents',
    description:
      'Dedicated reasoning agent completions for tasks that demand deliberate, step-by-step thinking before answering.',
  },
  {
    icon: Plug,
    title: 'Tools & MCP',
    description:
      'Give agents real capabilities: Exa web search, Model Context Protocol servers, vision and image analysis, and OpenAI-style function calling.',
  },
  {
    icon: FileJson,
    title: 'Structured outputs',
    description:
      'Schema-enforced JSON output from your agents, so downstream systems consume swarm results without parsing gymnastics.',
  },
  {
    icon: Globe,
    title: 'OpenAI-compatible',
    description:
      'A drop-in chat-completions endpoint powered by a high-efficiency runtime optimized for concurrency. Point your existing SDK at Swarms and ship.',
  },
];

const ARCHITECTURES = [
  {
    name: 'Hierarchical Swarm',
    description: 'A manager agent delegates to worker agents.',
  },
  {
    name: 'Sequential Workflow',
    description: 'Agents run one after another; each builds on the previous output.',
  },
  {
    name: 'Concurrent Workflow',
    description: 'All agents run in parallel on the same task.',
  },
  {
    name: 'Graph Workflow',
    description: 'Agents connected as a DAG — work flows along the edges you define.',
  },
  {
    name: 'Mixture of Agents',
    description: 'Multiple agents respond; an aggregator synthesizes the answer.',
  },
  {
    name: 'Council as a Judge',
    description: 'A council of agents judges and selects the best response.',
  },
  {
    name: 'Debate with Judge',
    description: 'Agents debate; a judge issues the verdict.',
  },
  {
    name: 'LLM Council',
    description: 'A council of LLMs collaborates on a single answer.',
  },
  {
    name: 'Multi-Agent Router',
    description: 'A router picks the best agent for each task.',
  },
  {
    name: 'Majority Voting',
    description: 'Agents vote; the majority answer wins.',
  },
  {
    name: 'Group Chat',
    description: 'Agents converse in a shared chat to reach a conclusion.',
  },
  {
    name: 'Round Robin',
    description: 'Agents take turns in a fixed rotation.',
  },
  {
    name: 'Agent Rearrange',
    description: 'A custom flow string defines how agents pass work.',
  },
  {
    name: 'Heavy Swarm',
    description: 'Heavy reasoning swarm — slow but thorough.',
  },
  {
    name: 'Batched Grid Workflow',
    description: 'A grid of agents processes tasks in batches.',
  },
  {
    name: 'Auto Swarm Builder',
    description: 'Auto-generates the right swarm structure from your task.',
  },
];

const CONSOLE_FEATURES = [
  {
    icon: Hammer,
    title: 'Workbench',
    description:
      'Author single agents — model, prompt, temperature, tools — and execute them against the production API in one click.',
  },
  {
    icon: Sparkles,
    title: 'Playground',
    description:
      'Compose multi-agent swarms interactively. Pick an architecture, wire up agents, and iterate before you ship.',
  },
  {
    icon: History,
    title: 'Execution history',
    description:
      'Every run logged with token usage and per-run cost. Search, filter by date, and export to CSV for audits.',
  },
  {
    icon: Activity,
    title: 'Observability',
    description:
      'Live dashboards for agent counts, request volume, success rate, and rate-limit windows across minute, hour, and day.',
  },
  {
    icon: Cpu,
    title: 'Model catalog',
    description:
      'A live catalog of frontier models — GPT, Claude, Gemini, Llama, and more — usable by any agent in any swarm.',
  },
  {
    icon: Wand2,
    title: 'Prompt generator',
    description:
      'Auto-generate production-grade system prompts for any agent role, straight from the console.',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: Boxes,
    title: 'Define your agents',
    description:
      'Give each agent a name, model, and system prompt in the Workbench — or auto-generate prompts. Each agent can use a different model, so capability matches the role.',
  },
  {
    step: '02',
    icon: Workflow,
    title: 'Pick an architecture',
    description:
      'Choose one of 16 battle-tested swarm patterns, or pass "auto" and let Auto Swarm Builder design the structure from your task.',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Deploy and manage',
    description:
      'Ship through one production API call. Track every execution, token, and dollar in the console — with full history for audits and debugging.',
  },
];

const ENTERPRISE_FEATURES = [
  {
    icon: Globe,
    title: 'Global infrastructure',
    description:
      'Four regional endpoints keep latency low wherever your workloads run, with response compression and priority processing for premium tiers.',
  },
  {
    icon: BarChart3,
    title: 'Transparent rate limits',
    description:
      'Real-time X-RateLimit-* headers on every authenticated response, with per-minute, hour, and day windows visible on your dashboard.',
  },
  {
    icon: History,
    title: 'Audit-ready history',
    description:
      'Complete execution logs with timestamps, token counts, and per-run cost — retained per your plan and deletable by you at any time.',
  },
  {
    icon: KeyRound,
    title: 'API key management',
    description:
      'Issue and rotate workspace keys from the console, with per-user tracking across keys and built-in abuse protection.',
  },
  {
    icon: ShieldCheck,
    title: 'Security by default',
    description:
      'Administrative, technical, and physical safeguards protect your data. Personal information is never sold, and subprocessors are bound by data-protection obligations.',
  },
  {
    icon: Layers,
    title: 'Batch at scale',
    description:
      'Batch completions for agents, swarms, and research sessions — with scheduling patterns for cron and Airflow pipelines.',
  },
];

const SDKS = [
  { name: 'Python', detail: 'pip install swarms' },
  { name: 'TypeScript', detail: 'Node, Deno & edge' },
  { name: 'Go', detail: 'Idiomatic services client' },
  { name: 'Java', detail: 'Enterprise JVM stacks' },
  { name: 'C#', detail: '.NET applications' },
  { name: 'MCP Server', detail: 'Model Context Protocol' },
];

const FAQS = [
  {
    question: 'What is The Swarms Cloud?',
    answer:
      'The Swarms Cloud is the enterprise platform for building, deploying, and managing multi-agent AI systems. It pairs a production API with 20+ endpoints for agents, swarms, research, and reasoning with a management console for observability, execution history, and cost control.',
  },
  {
    question: 'How is it different from calling a model API directly?',
    answer:
      'Swarms Cloud adds orchestration and management on top of raw model calls: 16 multi-agent architectures, automatic swarm construction, batch operations, tool integrations (MCP, web search), and execution history with rate-limit telemetry — all through an OpenAI-compatible endpoint.',
  },
  {
    question: 'Which models can my agents use?',
    answer:
      'Any model from the live catalog: GPT, Claude, Gemini, Llama, and other frontier providers. Each agent in a swarm can use a different model, letting you match capability and cost to each role independently.',
  },
  {
    question: 'How does pricing work?',
    answer:
      'Token-based pricing at $6.50 per 1M input tokens and $18.50 per 1M output tokens, with a flat unified rate across all models. Night mode offers 50% off swarm tokens from 8 PM to 6 AM Pacific. Use the pricing calculator to model your exact workload.',
  },
];

function CtaLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'brand' | 'outline';
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-medium rounded-md transition-colors duration-150 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  const styles =
    variant === 'brand'
      ? 'bg-brand text-brand-foreground hover:bg-brand/90 border border-brand'
      : 'bg-transparent text-foreground hover:bg-muted border border-border';
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-12">
      <p className="text-xs font-medium uppercase tracking-wider text-brand mb-3">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const CODE_SAMPLE = `curl https://api.swarms.world/v1/swarm/completions \\
  -H "x-api-key: $SWARMS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "research-pipeline",
    "swarm_type": "HierarchicalSwarm",
    "task": "Produce a competitive analysis of the EV market",
    "agents": [
      { "agent_name": "Director",   "model_name": "gpt-5.4" },
      { "agent_name": "Researcher", "model_name": "claude-sonnet-4-6" },
      { "agent_name": "Analyst",    "model_name": "gpt-5.4" }
    ]
  }'`;

function PublicHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <Link href="/learn-more" className="flex items-center gap-2 min-w-0">
          <SwarmsMark className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-foreground truncate">
            Swarms Cloud
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/pricing"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Pricing
          </Link>
          {signedIn ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 justify-center h-8 px-3 text-sm font-medium rounded-md bg-brand text-brand-foreground hover:bg-brand/90 border border-brand transition-colors"
            >
              Open dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md text-foreground hover:bg-muted border border-border transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md bg-brand text-brand-foreground hover:bg-brand/90 border border-brand transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

async function getSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function LearnMorePage() {
  const signedIn = await getSignedIn();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to deploy a multi-agent swarm with Swarms Cloud',
    description:
      'Build, deploy, and manage multi-agent AI systems in three steps using the Swarms Cloud platform.',
    step: WORKFLOW_STEPS.map((step) => ({
      '@type': 'HowToStep',
      name: step.title,
      text: step.description,
      position: parseInt(step.step),
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Learn More',
        item: `${SITE.url}/learn-more`,
      },
    ],
  };

  return (
    <div className="page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicHeader signedIn={signedIn} />

      <main className="page-main">
        {/* Hero — introduce The Swarms Cloud */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--brand)/0.07),transparent_55%)]"
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center">
            <SwarmsMark className="w-14 h-14 mx-auto mb-6" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mb-4">
              Introducing
            </p>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground text-balance">
              The Swarms Cloud
            </h1>
            <p className="mt-4 text-lg sm:text-2xl font-medium text-foreground/80 tracking-tight">
              The ultimate multi-agent management system
            </p>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Build, deploy, and manage fleets of AI agents from one place.
              Hierarchical, parallel, and collaborative workflows run on a
              high-efficiency runtime optimized for concurrency — with full
              observability over every execution, token, and dollar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {signedIn ? (
                <CtaLink href="/" variant="brand">
                  Open the Dashboard
                  <ArrowRight className="w-4 h-4" />
                </CtaLink>
              ) : (
                <CtaLink href="/signup" variant="brand">
                  Start building free
                  <ArrowRight className="w-4 h-4" />
                </CtaLink>
              )}
              <CtaLink href="/pricing" variant="outline">
                Estimate your costs
              </CtaLink>
            </div>

            <dl className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-lg border border-border bg-border overflow-hidden">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="bg-card px-4 py-5">
                  <dd className="text-2xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </dd>
                  <dt className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* What is it */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand mb-3">
                What is The Swarms Cloud
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">
                One platform for the entire agent lifecycle
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Most teams stitch agents together from scripts, queues, and
                dashboards that were never built for AI workloads. The Swarms
                Cloud replaces that patchwork with a single system: a
                production API with 20+ endpoints for agents, swarms, deep
                research, and reasoning — and a management console that shows
                you exactly what your fleet is doing and what it costs.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Single agents, batch fleets, and 16 swarm architectures',
                  'Built-in tools: web search, MCP, vision, function calling',
                  'Execution history, rate-limit telemetry, and cost per run',
                  'OpenAI-compatible endpoint for drop-in migration',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                New to Swarms?{' '}
                <a
                  href="https://docs.swarms.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  Visit the API documentation → docs.swarms.ai
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-subtle overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <span className="led led-running" />
                <span className="text-xs font-mono text-muted-foreground">
                  POST /v1/swarm/completions
                </span>
              </div>
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-subtle-foreground">
                <code>{CODE_SAMPLE}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-y border-border bg-subtle/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Capabilities"
              title="Everything an agent fleet needs, behind one API"
              subtitle="From a single completion to batched research sessions — every capability is a first-class endpoint."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-border-strong"
                >
                  <div className="w-9 h-9 rounded-md border border-brand/20 bg-brand/5 flex items-center justify-center mb-4">
                    <feature.icon className="w-[18px] h-[18px] text-brand" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architectures */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <SectionHeading
            eyebrow="Architectures"
            title="16 swarm architectures, zero orchestration code"
            subtitle="Every coordination pattern your team would otherwise hand-build — hierarchies, debates, councils, routers — available as a single API parameter."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ARCHITECTURES.map((arch) => (
              <div
                key={arch.name}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3.5"
              >
                <GitBranch className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {arch.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {arch.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link
              href="/swarms"
              className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline underline-offset-4"
            >
              Explore all swarm architectures
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </section>

        {/* Management console */}
        <section className="border-y border-border bg-subtle/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Management console"
              title="See and steer everything your agents do"
              subtitle="The console is mission control for your fleet — build, run, watch, and audit without leaving the browser."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CONSOLE_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-border-strong"
                >
                  <feature.icon className="w-5 h-5 text-brand mb-3.5" />
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <SectionHeading
            eyebrow="How it works"
            title="From idea to production swarm in three steps"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-md border border-brand/20 bg-brand/5 flex items-center justify-center">
                    <step.icon className="w-[18px] h-[18px] text-brand" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise */}
        <section className="border-y border-border bg-subtle/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Enterprise"
              title="Built for teams that ship to production"
              subtitle="Run agents with the same operational rigor as the rest of your stack — global, auditable, and predictable."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ENTERPRISE_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <feature.icon className="w-5 h-5 text-brand mb-3.5" />
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand mb-3">
                Pricing
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">
                One rate. Every model. No surprises.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Token-based pricing that stays the same no matter which model
                your agents use. Model your exact workload — tokens, agents,
                images, and tools — with the interactive calculator.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  'Unified rate across all supported models',
                  'Per-run cost visible in execution history',
                  '50% night-mode discount, 8 PM–6 AM Pacific',
                  'Batch operations for throughput cost advantages',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <CtaLink href="/pricing" variant="brand">
                  Open the pricing calculator
                  <ArrowRight className="w-4 h-4" />
                </CtaLink>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-subtle p-5 text-center">
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  $6.50
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  per 1M input tokens
                </p>
              </div>
              <div className="rounded-lg border border-border bg-subtle p-5 text-center">
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  $18.50
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  per 1M output tokens
                </p>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-subtle p-5 flex items-center justify-center gap-3">
                <MoonStar className="w-5 h-5 text-brand flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    Night mode: 50% off swarm tokens
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every night, 8 PM–6 AM Pacific — ideal for batch pipelines
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="border-y border-border bg-subtle/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Developer experience"
              title="Meet your stack where it lives"
              subtitle="Official client libraries for every major ecosystem, OpenAI SDK compatibility, and an MCP server for agent-native tooling."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SDKS.map((sdk) => (
                <div
                  key={sdk.name}
                  className="rounded-lg border border-border bg-card px-4 py-4 text-center"
                >
                  <Package className="w-4 h-4 text-brand mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {sdk.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {sdk.detail}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sdks"
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline underline-offset-4"
              >
                Browse SDKs and quickstarts
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="https://docs.swarms.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Full API reference
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="rounded-lg border border-border bg-card p-5"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <SwarmsMark className="w-10 h-10 mx-auto mb-5" />
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance max-w-2xl mx-auto">
              Stop managing agents one at a time
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Join the teams orchestrating production agent fleets on The
              Swarms Cloud. Create your workspace in minutes — free credits
              included.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {signedIn ? (
                <>
                  <CtaLink href="/" variant="brand">
                    Open your dashboard
                    <ArrowRight className="w-4 h-4" />
                  </CtaLink>
                  <CtaLink href="/playground" variant="outline">
                    Try the Playground
                  </CtaLink>
                </>
              ) : (
                <>
                  <CtaLink href="/signup" variant="brand">
                    Create your workspace
                    <ArrowRight className="w-4 h-4" />
                  </CtaLink>
                  <CtaLink href="/login" variant="outline">
                    Sign in
                  </CtaLink>
                </>
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-5">
              <a
                href="https://github.com/kyegomez/swarms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
              <a
                href="https://docs.swarms.world"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Open-source swarms package
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
