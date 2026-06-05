'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  APPS,
  APP_CATEGORIES,
  CATEGORY_ORDER,
  type AppCategory,
  type AppEntry,
} from '@/lib/apps-catalog';
import { AppWindow, ArrowUpRight } from 'lucide-react';

const CATEGORY_ACCENT: Record<
  AppCategory,
  { dot: string; tint: string; iconColor: string }
> = {
  operate: {
    dot: 'bg-success',
    tint: 'bg-success/5 border-success/20',
    iconColor: 'text-success',
  },
  build: {
    dot: 'bg-accent',
    tint: 'bg-accent/5 border-accent/20',
    iconColor: 'text-accent',
  },
  catalog: {
    dot: 'bg-warning',
    tint: 'bg-warning/5 border-warning/20',
    iconColor: 'text-warning',
  },
  tools: {
    dot: 'bg-danger',
    tint: 'bg-danger/5 border-danger/20',
    iconColor: 'text-danger',
  },
  account: {
    dot: 'bg-muted-foreground',
    tint: 'bg-subtle border-border',
    iconColor: 'text-muted-foreground',
  },
};

function matchesQuery(entry: AppEntry, q: string): boolean {
  if (!q) return true;
  const haystack = [
    entry.label,
    entry.description,
    entry.longDescription,
    entry.href,
    ...entry.keywords,
    APP_CATEGORIES[entry.category].label,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export default function AppsDirectoryPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPS.filter((entry) => matchesQuery(entry, q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<AppCategory, AppEntry[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const entry of filtered) {
      map.get(entry.category)?.push(entry);
    }
    return map;
  }, [filtered]);

  const hasResults = filtered.length > 0;

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-8 lg:py-12 box-border">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div className="flex flex-col gap-2 max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                Directory
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Apps
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every page, tool, and product in Swarms Cloud — grouped by
                purpose. Press{' '}
                <kbd className="inline-flex items-center align-middle px-1.5 h-5 rounded border border-border bg-subtle text-[11px] font-mono text-muted-foreground">
                  ⌘K
                </kbd>{' '}
                to jump anywhere.
              </p>
            </div>

            <div className="flex items-center gap-3 md:w-96">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search apps, tools, products…"
                className="flex-1"
              />
              <span className="px-2 h-8 rounded-md border border-border bg-subtle inline-flex items-center text-xs tabular-nums text-muted-foreground flex-shrink-0">
                {filtered.length}/{APPS.length}
              </span>
            </div>
          </div>

          {!hasResults ? (
            <div className="flex flex-col items-center justify-center min-h-[320px] rounded-xl border border-dashed border-border bg-subtle/30 p-10">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                <AppWindow className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
                No apps match
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Try a different search query, or clear the filter to see
                everything.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {CATEGORY_ORDER.map((category) => {
                const entries = grouped.get(category) ?? [];
                if (entries.length === 0) return null;
                const meta = APP_CATEGORIES[category];
                const accent = CATEGORY_ACCENT[category];
                return (
                  <section key={category}>
                    {/* Section header */}
                    <div className="flex items-baseline justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${accent.dot} flex-shrink-0`}
                        />
                        <h2 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-foreground">
                          {meta.label}
                        </h2>
                        <span className="text-[11px] tabular-nums text-muted-foreground font-mono">
                          {entries.length}
                        </span>
                        <p className="text-xs text-muted-foreground truncate hidden sm:block ml-2">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entries.map((entry) => (
                        <AppCard
                          key={entry.href}
                          entry={entry}
                          accent={accent}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AppCard({
  entry,
  accent,
}: {
  entry: AppEntry;
  accent: { tint: string; iconColor: string };
}) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      className="group relative flex flex-col gap-4 p-5 rounded-xl border border-border bg-card transition-all duration-200 hover:border-border-strong hover:bg-subtle/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Icon + arrow row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-lg border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-[1.02] ${accent.tint}`}
        >
          <Icon className={`w-5 h-5 ${accent.iconColor}`} />
        </div>
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground transition-all duration-200 group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="text-[15px] font-semibold tracking-tight text-foreground truncate">
          {entry.label}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {entry.longDescription || entry.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2 mt-auto border-t border-border/70">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
          {entry.href}
        </span>
      </div>
    </Link>
  );
}
