'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client-fetch';
import {
  Cpu,
  Loader2,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';

type ModelEntry = {
  id: string;
  raw: unknown;
  searchText: string;
};

function flattenModels(payload: unknown): ModelEntry[] {
  if (!payload) return [];

  const collected: ModelEntry[] = [];

  const pushEntry = (id: string, raw: unknown) => {
    const searchText = JSON.stringify(raw ?? id).toLowerCase();
    collected.push({ id, raw, searchText });
  };

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          pushEntry(item, item);
        } else if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const id =
            (typeof rec.id === 'string' && rec.id) ||
            (typeof rec.name === 'string' && rec.name) ||
            (typeof rec.model === 'string' && rec.model) ||
            (typeof rec.model_name === 'string' && rec.model_name) ||
            JSON.stringify(item);
          pushEntry(String(id), item);
        }
      }
      return;
    }

    if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      if (Array.isArray(rec.models)) {
        visit(rec.models);
        return;
      }
      if (Array.isArray(rec.data)) {
        visit(rec.data);
        return;
      }
      for (const [key, v] of Object.entries(rec)) {
        if (Array.isArray(v)) {
          for (const item of v) {
            if (typeof item === 'string') {
              pushEntry(`${key}/${item}`, { provider: key, model: item });
            } else if (item && typeof item === 'object') {
              const rec2 = item as Record<string, unknown>;
              const id =
                (typeof rec2.id === 'string' && rec2.id) ||
                (typeof rec2.name === 'string' && rec2.name) ||
                (typeof rec2.model === 'string' && rec2.model) ||
                JSON.stringify(item);
              pushEntry(String(id), { provider: key, ...rec2 });
            }
          }
        } else if (typeof v === 'string') {
          pushEntry(`${key}: ${v}`, { [key]: v });
        }
      }
    }
  };

  visit(payload);
  return collected;
}

export default function ModelsPage() {
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = refresh ? '/api/models?refresh=1' : '/api/models';
      const res = await apiFetch(url, { method: 'GET' });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setRaw(data?.models ?? data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load models');
      setRaw(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const models = useMemo(() => flattenModels(raw), [raw]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) => m.id.toLowerCase().includes(q) || m.searchText.includes(q)
    );
  }, [models, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
              Models
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Browse every model available for agent and swarm configuration.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 h-6 rounded-md border border-border bg-subtle inline-flex items-center tabular-nums">
                {filtered.length} of {models.length}
              </span>
            </div>
            <div className="flex items-center gap-2 lg:w-80">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search models…"
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

          {loading && !raw ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading models…</p>
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
                <Cpu className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
                {models.length === 0 ? 'No models returned' : 'No models match'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {models.length === 0
                  ? 'The API returned no models for this account.'
                  : 'Try a different search query.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {paginated.map((m, idx) => (
                  <ModelCard
                    key={`${m.id}-${idx}`}
                    entry={m}
                    onCopy={handleCopy}
                    copied={copiedId === m.id}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100, 200]}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

type ExampleLang = 'python' | 'typescript' | 'curl';

const EXAMPLE_LANGS: { key: ExampleLang; label: string }[] = [
  { key: 'python', label: 'Python' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'curl', label: 'cURL' },
];

function buildExamplePayload(modelName: string) {
  return {
    agent_config: {
      agent_name: 'Research Analyst',
      description: 'Expert in analyzing and synthesizing research data',
      system_prompt:
        'You are a Research Analyst with expertise in data analysis and synthesis.',
      model_name: modelName,
      max_loops: 1,
      max_tokens: 8192,
      temperature: 0.5,
    },
    task: 'Analyze the impact of artificial intelligence on healthcare',
  };
}

function buildAgentExample(modelName: string, lang: ExampleLang): string {
  const payload = buildExamplePayload(modelName);
  const json = JSON.stringify(payload, null, 4);

  if (lang === 'python') {
    return [
      'import requests',
      '',
      `payload = ${json}`,
      '',
      'response = requests.post(',
      '    "https://api.swarms.world/v1/agent/completions",',
      '    headers={"x-api-key": "your-api-key"},',
      '    json=payload,',
      ')',
      '',
      'print(response.json())',
    ].join('\n');
  }

  if (lang === 'typescript') {
    return [
      `const payload = ${json};`,
      '',
      "const response = await fetch('https://api.swarms.world/v1/agent/completions', {",
      "  method: 'POST',",
      '  headers: {',
      "    'Content-Type': 'application/json',",
      "    'x-api-key': 'your-api-key',",
      '  },',
      '  body: JSON.stringify(payload),',
      '});',
      '',
      'const result = await response.json();',
      'console.log(result);',
    ].join('\n');
  }

  return [
    'curl -X POST "https://api.swarms.world/v1/agent/completions" \\',
    '  -H "Content-Type: application/json" \\',
    '  -H "x-api-key: your-api-key" \\',
    `  -d '${JSON.stringify(payload, null, 2)}'`,
  ].join('\n');
}

function ModelCard({
  entry,
  onCopy,
  copied,
}: {
  entry: ModelEntry;
  onCopy: (id: string) => void;
  copied: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [exampleCopied, setExampleCopied] = useState(false);
  const [lang, setLang] = useState<ExampleLang>('python');

  const meta =
    entry.raw && typeof entry.raw === 'object'
      ? (entry.raw as Record<string, unknown>)
      : null;
  const provider =
    (meta && typeof meta.provider === 'string' && meta.provider) || null;
  const description =
    (meta &&
      (typeof meta.description === 'string'
        ? meta.description
        : typeof meta.summary === 'string'
        ? meta.summary
        : null)) ||
    null;

  const modelName =
    (meta && typeof meta.model === 'string' && meta.model) ||
    (meta && typeof meta.model_name === 'string' && meta.model_name) ||
    entry.id;
  const example = useMemo(
    () => buildAgentExample(modelName, lang),
    [modelName, lang]
  );

  const handleCopyExample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(example);
      setExampleCopied(true);
      setTimeout(() => setExampleCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 transition-colors hover:border-border-strong">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-start justify-between gap-2 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
      >
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
            <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground font-mono truncate">
              {entry.id}
            </div>
            {provider && (
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {provider}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onCopy(entry.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onCopy(entry.id);
              }
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Copy model id"
            title="Copy model id"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </span>
          <span
            className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground"
            aria-hidden="true"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </span>
        </div>
      </button>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-3">
          {description}
        </p>
      )}

      {expanded && (
        <div className="text-xs">
          <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
            <span className="text-muted-foreground truncate">
              Single agent completion
            </span>
            <code className="px-1.5 py-0.5 rounded bg-subtle border border-border text-[10px] text-muted-foreground flex-shrink-0">
              POST /v1/agent/completions
            </code>
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div
              role="tablist"
              aria-label="Example language"
              className="inline-flex items-center rounded-md border border-border bg-subtle p-0.5"
            >
              {EXAMPLE_LANGS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  role="tab"
                  aria-selected={lang === l.key}
                  onClick={() => setLang(l.key)}
                  className={`px-2 h-6 rounded text-[11px] transition-colors ${
                    lang === l.key
                      ? 'bg-card text-foreground border border-border shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopyExample}
              className="inline-flex items-center gap-1 px-2 h-6 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Copy example code"
              title="Copy example code"
            >
              {exampleCopied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {exampleCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-2 rounded-md bg-subtle border border-border overflow-x-auto text-[11px] leading-relaxed text-foreground">
            {example}
          </pre>
        </div>
      )}

      {meta && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none">
            Details
          </summary>
          <pre className="mt-2 p-2 rounded-md bg-subtle border border-border overflow-x-auto text-[11px] leading-relaxed text-foreground">
            {JSON.stringify(entry.raw, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
