'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { apiFetch } from '@/lib/api/client-fetch';
import {
  Wand2,
  Sparkles,
  Loader2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Clock,
  RotateCw,
} from 'lucide-react';

type HistoryEntry = {
  id: string;
  timestamp: string;
  goal: string;
  domain: string;
  audience: string;
  constraints: string;
  outputFormat: string;
  prompt: string;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    total_cost?: number;
  } | null;
};

const STORAGE_KEY = 'prompt-architect-history';
const MAX_HISTORY = 20;

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

export default function PromptGeneratorPage() {
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('');
  const [audience, setAudience] = useState('');
  const [constraints, setConstraints] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  const [prompt, setPrompt] = useState('');
  const [usage, setUsage] = useState<HistoryEntry['usage']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const canSubmit = useMemo(() => goal.trim().length > 0 && !loading, [goal, loading]);

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setPrompt('');
    setUsage(null);
    setCopied(false);

    try {
      const res = await apiFetch('/api/prompt-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          domain: domain.trim(),
          audience: audience.trim(),
          constraints: constraints.trim(),
          outputFormat: outputFormat.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const generated = (data?.prompt as string) ?? '';
      if (!generated) {
        throw new Error('The agent returned an empty prompt.');
      }
      setPrompt(generated);
      setUsage(data?.usage ?? null);

      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        goal: goal.trim(),
        domain: domain.trim(),
        audience: audience.trim(),
        constraints: constraints.trim(),
        outputFormat: outputFormat.trim(),
        prompt: generated,
        usage: data?.usage ?? null,
      };
      const next = [entry, ...history].slice(0, MAX_HISTORY);
      setHistory(next);
      saveHistory(next);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const handleRestore = (entry: HistoryEntry) => {
    setGoal(entry.goal);
    setDomain(entry.domain);
    setAudience(entry.audience);
    setConstraints(entry.constraints);
    setOutputFormat(entry.outputFormat);
    setPrompt(entry.prompt);
    setUsage(entry.usage);
    setError(null);
    setCopied(false);
  };

  const handleDeleteEntry = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Tools</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Prompt generator
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Auto-generate production-grade system prompts for AI agents. Powered
              by <span className="text-foreground font-mono">claude-sonnet-4-6</span>{' '}
              and a specialized <span className="text-foreground">Prompt Architect</span>{' '}
              agent.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Form */}
            <section className="lg:col-span-2 space-y-4">
              <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Brief
                  </h2>
                </div>

                <Field
                  label="Agent goal"
                  required
                  hint="What should this agent do? Be specific."
                >
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={4}
                    placeholder="e.g. Triage incoming customer-support emails into the right Linear project, draft a one-paragraph reply for the agent on rotation to send."
                    className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y"
                  />
                </Field>

                <Field label="Domain / role" hint="Optional. Sharpen the agent's expertise.">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Senior product analyst at a B2B SaaS company"
                    className="w-full h-9 px-3 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                </Field>

                <Field label="Target users" hint="Optional. Who will interact with this agent?">
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. On-call support engineers"
                    className="w-full h-9 px-3 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                </Field>

                <Field label="Constraints" hint="Optional. Things the agent must always or never do.">
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={2}
                    placeholder="e.g. Never share customer PII; always cite the source ticket ID."
                    className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y"
                  />
                </Field>

                <Field label="Preferred output format" hint="Optional. Markdown, JSON, plain text, etc.">
                  <input
                    type="text"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    placeholder="e.g. JSON with fields {project, priority, draft_reply}"
                    className="w-full h-9 px-3 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                </Field>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Generating…' : 'Generate prompt'}
                </button>
              </div>

              {/* History */}
              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      Recent
                    </h2>
                    <span className="px-1.5 h-4 rounded-sm border border-border bg-subtle text-[10px] tabular-nums text-muted-foreground inline-flex items-center">
                      {history.length}
                    </span>
                  </div>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Generated prompts will appear here, stored locally in your browser.
                  </p>
                ) : (
                  <ul className="divide-y divide-border -mx-2">
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <div className="flex items-start gap-2 px-2 py-2 group">
                          <button
                            type="button"
                            onClick={() => handleRestore(entry)}
                            className="flex-1 min-w-0 text-left"
                            title="Restore"
                          >
                            <div className="text-xs text-foreground truncate">
                              {entry.goal || 'Untitled prompt'}
                            </div>
                            <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-danger transition-all flex-shrink-0"
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Output */}
            <section className="lg:col-span-3 space-y-4">
              <div className="rounded-lg border border-border bg-card p-5 min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      Generated system prompt
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt && (
                      <>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          title="Regenerate"
                        >
                          <RotateCw
                            className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
                          />
                          Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Copy"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-success" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {loading && !prompt ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Prompt Architect is drafting…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Typically 5–15 seconds with claude-sonnet-4-6.
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                    <XCircle className="w-5 h-5 text-danger" />
                    <p className="text-sm text-foreground max-w-md">{error}</p>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="text-xs text-accent hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : prompt ? (
                  <>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="flex-1 w-full min-h-[400px] p-4 rounded-md border border-border bg-subtle text-foreground text-sm font-mono leading-relaxed whitespace-pre-wrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y"
                      spellCheck={false}
                    />
                    {usage && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground font-mono">
                        {usage.input_tokens !== undefined && (
                          <span>
                            Input: {usage.input_tokens.toLocaleString()} tok
                          </span>
                        )}
                        {usage.output_tokens !== undefined && (
                          <span>
                            Output: {usage.output_tokens.toLocaleString()} tok
                          </span>
                        )}
                        {usage.total_cost !== undefined && (
                          <span>Cost: ${usage.total_cost.toFixed(4)}</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground">
                      Describe an agent to generate its system prompt.
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      The Prompt Architect agent will translate your brief into a
                      drop-in production prompt with responsibilities, operating
                      principles, output format, and boundaries.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground inline-flex items-center gap-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}
