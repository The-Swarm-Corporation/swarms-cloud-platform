'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import { ProviderBadge } from '@/components/models/ProviderBadge';
import { apiFetch } from '@/lib/api/client-fetch';
import { CLOUD_URL } from '@/lib/models/model-docs';
import {
  flattenModels,
  entryModelName,
  entryProvider,
  displayModelName,
  cleanModelName,
  splitModelId,
  providerLabel,
  modelHref,
  buildAgentPayloadVariant,
  buildSwarmPayload,
  buildModelFaqs,
  modelOverview,
  exampleVariantsFor,
  rankRecommendations,
  type ExampleVariant,
  type ModelEntry,
} from '@/lib/models/catalog';
import { buildModelDocs } from '@/lib/models/model-docs';
import {
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  FileText,
  FlaskConical,
  KeyRound,
  Loader2,
  TerminalSquare,
} from 'lucide-react';

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

function CopyDocsButton({ docs }: { docs: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(docs);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 justify-center h-9 px-4 text-sm font-medium rounded-md bg-card text-foreground hover:bg-muted active:bg-muted/70 border border-border transition-colors flex-shrink-0"
      aria-label="Copy the quick-start docs for this model as Markdown"
      title="Copy the quick-start docs as Markdown"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-success" />
          Copied
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Copy Docs
        </>
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

export function ModelDetailClient({ modelId }: { modelId: string }) {
  const [catalog, setCatalog] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<ExampleVariant>('basic');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/models', { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCatalog(flattenModels(data?.models ?? data));
      } catch {
        // page still renders from the URL id
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const entry = useMemo(
    () =>
      catalog.find((m) => m.id === modelId || entryModelName(m) === modelId) ??
      null,
    [catalog, modelId]
  );

  const modelName = entry ? entryModelName(entry) : modelId;
  const displayName = displayModelName(modelId);
  const provider = entry
    ? entryProvider(entry)
    : entryProvider({ id: modelId, raw: null, searchText: '' });

  const meta =
    entry?.raw && typeof entry.raw === 'object'
      ? (entry.raw as Record<string, unknown>)
      : null;
  const description =
    (meta &&
      (typeof meta.description === 'string'
        ? meta.description
        : typeof meta.summary === 'string'
        ? meta.summary
        : null)) ||
    null;

  const recommended = useMemo(
    () => rankRecommendations(catalog, modelId, 3),
    [catalog, modelId]
  );
  const sameProvider =
    recommended.length > 0 &&
    provider !== null &&
    recommended.every(
      (m) => entryProvider(m)?.toLowerCase() === provider.toLowerCase()
    );

  const variants = useMemo(() => exampleVariantsFor(modelName), [modelName]);
  const activeVariant = variants.some((v) => v.key === variant)
    ? variant
    : 'basic';
  const singleAgentPayload = useMemo(
    () => buildAgentPayloadVariant(modelName, activeVariant),
    [modelName, activeVariant]
  );
  const swarmPayload = useMemo(() => buildSwarmPayload(modelName), [modelName]);
  const faqs = useMemo(() => buildModelFaqs(modelId), [modelId]);

  const playgroundHref = `/playground?model=${encodeURIComponent(modelName)}`;
  const docs = useMemo(
    () => buildModelDocs({ modelId, modelName, description }),
    [modelId, modelName, description]
  );
  const docsMdUrl = `${CLOUD_URL}${modelHref(modelId)}.md`;
  const docsMdCurl = `curl -s ${docsMdUrl}`;

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-5xl mx-auto w-full">
          <Link
            href="/models"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All models
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3 min-w-0">
              <ProviderBadge provider={provider} size="lg" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {displayName}
                </h1>
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <code className="text-xs font-mono text-muted-foreground truncate">
                    {modelName}
                  </code>
                  <CopyButton text={modelName} label="Copy model name" />
                </div>
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                  {description ?? modelOverview(modelId)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyDocsButton docs={docs} />
              <Link
                href={playgroundHref}
                className="inline-flex items-center gap-1.5 justify-center h-9 px-4 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80 border border-foreground transition-colors flex-shrink-0"
              >
                <FlaskConical className="w-4 h-4" />
                Open in Playground
              </Link>
            </div>
          </div>

          {loading && catalog.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading catalog details…
            </div>
          )}

          <div className="flex flex-col gap-1 mb-4">
            <p className="text-xs text-muted-foreground">Quick start</p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Get started with {cleanModelName(splitModelId(modelId).name)}
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
              title="Run a single agent"
              icon={<Cpu className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Execute one agent with{' '}
                <code className="text-xs font-mono">{modelName}</code> via the
                Agent Completions API.
              </p>
              {variants.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Example type"
                  className="inline-flex items-center rounded-md border border-border bg-subtle p-0.5 mb-3"
                >
                  {variants.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      role="tab"
                      aria-selected={activeVariant === v.key}
                      onClick={() => setVariant(v.key)}
                      className={`px-2.5 h-6 rounded text-[11px] transition-colors ${
                        activeVariant === v.key
                          ? 'bg-card text-foreground border border-border shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <SnippetPreview
                endpoint="/v1/agent/completions"
                method="POST"
                payload={singleAgentPayload}
                title="Single agent completion"
              />
            </StepCard>

            <StepCard
              step={4}
              title="Scale to a multi-agent swarm"
              icon={<Cpu className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                Chain multiple agents on{' '}
                <code className="text-xs font-mono">{modelName}</code> with the
                Swarm Completions API.
              </p>
              <SnippetPreview
                endpoint="/v1/swarm/completions"
                method="POST"
                payload={swarmPayload}
                title="Multi-agent swarm"
              />
            </StepCard>

            <StepCard
              step={5}
              title="Grab these docs as Markdown"
              icon={<FileText className="w-4 h-4" />}
            >
              <p className="text-sm text-muted-foreground mb-3">
                This page is also available as a plain Markdown file, no
                HTML parsing required - handy for pasting into an LLM or
                letting an agent fetch it directly.
              </p>
              <div className="relative">
                <pre className="p-3 rounded-md bg-subtle border border-border overflow-x-auto text-[12px] leading-relaxed text-foreground font-mono">
                  {docsMdCurl}
                </pre>
                <CopyButton
                  text={docsMdCurl}
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
                {sameProvider && provider
                  ? `More from ${providerLabel(provider)}`
                  : 'More models to try'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommended.map((m) => (
                  <Link
                    key={m.id}
                    href={modelHref(m.id)}
                    className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5 min-w-0 transition-colors hover:border-border-strong hover:bg-muted/40"
                  >
                    <ProviderBadge provider={entryProvider(m)} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {displayModelName(m.id)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground truncate">
                        {entryModelName(m)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
