'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client-fetch';
import {
  flattenModels,
  entryModelName,
  displayModelName,
  modelHref,
  type ModelEntry,
} from '@/lib/models/catalog';
import {
  Cpu,
  Loader2,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  ArrowUpRight,
} from 'lucide-react';

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

function ModelCard({
  entry,
  onCopy,
  copied,
}: {
  entry: ModelEntry;
  onCopy: (id: string) => void;
  copied: boolean;
}) {
  const meta =
    entry.raw && typeof entry.raw === 'object'
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

  const modelName = entryModelName(entry);

  return (
    <Link
      href={modelHref(entry.id)}
      className="group rounded-lg border border-border bg-card p-4 flex flex-col gap-3 transition-colors hover:border-border-strong hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
            <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {displayModelName(entry.id)}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
              {modelName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCopy(entry.id);
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Copy model name"
            title="Copy model name"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <span
            className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground group-hover:text-foreground transition-colors"
            aria-hidden="true"
          >
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-3">
          {description}
        </p>
      )}
    </Link>
  );
}
