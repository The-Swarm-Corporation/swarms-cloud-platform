'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  Copy,
  Check,
  Github,
  Package,
  ArrowUpRight,
} from 'lucide-react';

type SDKKind = 'sdk' | 'mcp';

type SDK = {
  id: string;
  language: string;
  abbreviation: string;
  packageName: string;
  description: string;
  install: string | null;
  installNote?: string;
  installManager: string | null;
  repo: string | null;
  packageUrl: string | null;
  kind: SDKKind;
};

const SDKS: SDK[] = [
  {
    id: 'python',
    language: 'Python',
    abbreviation: 'py',
    packageName: 'swarms-client',
    description:
      'Idiomatic, type-hinted, async-friendly client for Python 3.9 and later.',
    install: 'pip install swarms-client',
    installManager: 'pip',
    repo: 'https://github.com/The-Swarm-Corporation/swarms-client',
    packageUrl: 'https://pypi.org/project/swarms-client/',
    kind: 'sdk',
  },
  {
    id: 'typescript',
    language: 'TypeScript',
    abbreviation: 'ts',
    packageName: 'swarms-ts',
    description:
      'Typed, Stainless-generated client. Runs in Node, Deno, Bun, and the browser.',
    install: 'npm install swarms-ts',
    installManager: 'npm',
    repo: 'https://github.com/The-Swarm-Corporation/swarms-ts',
    packageUrl: 'https://www.npmjs.com/package/swarms-ts',
    kind: 'sdk',
  },
  {
    id: 'go',
    language: 'Go',
    abbreviation: 'go',
    packageName: 'swarms-client-go',
    description: 'Single-import, zero-dependency client for Go 1.21 and later.',
    install: 'go get github.com/The-Swarm-Corporation/swarms-client-go',
    installManager: 'go',
    repo: 'https://github.com/The-Swarm-Corporation/swarms-client-go',
    packageUrl: null,
    kind: 'sdk',
  },
  {
    id: 'java',
    language: 'Java',
    abbreviation: 'java',
    packageName: 'swarms-java',
    description: 'JVM client compatible with Java 17+, Kotlin, and Android.',
    install: null,
    installNote: 'Maven and Gradle install instructions in the repository.',
    installManager: null,
    repo: 'https://github.com/The-Swarm-Corporation/swarms-java',
    packageUrl: null,
    kind: 'sdk',
  },
  {
    id: 'csharp',
    language: 'C# / .NET',
    abbreviation: 'cs',
    packageName: 'swarms-csharp',
    description: 'Async .NET client compatible with .NET 6 and later.',
    install: null,
    installNote: 'NuGet install instructions in the repository.',
    installManager: null,
    repo: 'https://github.com/The-Swarm-Corporation/swarms-csharp',
    packageUrl: null,
    kind: 'sdk',
  },
  {
    id: 'mcp',
    language: 'MCP Server',
    abbreviation: 'mcp',
    packageName: 'swarms-ts-mcp',
    description:
      'Model Context Protocol server. Plug Swarms into Claude Desktop, Cursor, and any other MCP-compatible client.',
    install: 'npx -y swarms-ts-mcp',
    installManager: 'npx',
    repo: null,
    packageUrl: 'https://www.npmjs.com/package/swarms-ts-mcp',
    kind: 'mcp',
  },
];

function packageRegistryLabel(sdk: SDK): string {
  if (sdk.installManager === 'pip') return 'PyPI';
  if (sdk.installManager === 'npm' || sdk.installManager === 'npx') return 'npm';
  return 'Package';
}

function matchesQuery(sdk: SDK, q: string): boolean {
  if (!q) return true;
  const hay = [
    sdk.language,
    sdk.abbreviation,
    sdk.packageName,
    sdk.description,
    sdk.installManager ?? '',
    sdk.repo ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function SDKsPage() {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SDKS.filter((s) => matchesQuery(s, q));
  }, [query]);

  const sdks = filtered.filter((s) => s.kind === 'sdk');
  const mcps = filtered.filter((s) => s.kind === 'mcp');

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-8 lg:py-12 box-border">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div className="flex flex-col gap-2 max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                Developers
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                SDKs
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build with the Swarms API in any language. Official, typed
                clients for Python, TypeScript, Go, Java, and C#, plus a Model
                Context Protocol server for Claude Desktop and Cursor.
              </p>
            </div>

            <div className="flex items-center gap-3 md:w-96">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search SDKs…"
                className="flex-1"
              />
              <span className="px-2 h-8 rounded-md border border-border bg-subtle inline-flex items-center text-xs tabular-nums text-muted-foreground flex-shrink-0">
                {filtered.length}/{SDKS.length}
              </span>
            </div>
          </div>

          {sdks.length > 0 && (
            <Section
              eyebrow="Client libraries"
              count={sdks.length}
              description="Drop-in clients across languages."
            >
              <SDKGrid
                items={sdks}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </Section>
          )}

          {mcps.length > 0 && (
            <Section
              eyebrow="Model Context Protocol"
              count={mcps.length}
              description="Plug Swarms into MCP-compatible clients."
              spacingTop
            >
              <SDKGrid
                items={mcps}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </Section>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[320px] rounded-xl border border-dashed border-border bg-subtle/30 p-10">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
                No SDKs match
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Try a different search query, or clear the filter to see
                everything.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({
  eyebrow,
  count,
  description,
  spacingTop,
  children,
}: {
  eyebrow: string;
  count: number;
  description: string;
  spacingTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={spacingTop ? 'mt-12' : ''}>
      <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-border">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-foreground">
            {eyebrow}
          </h2>
          <span className="text-[11px] tabular-nums text-muted-foreground font-mono">
            {count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function SDKGrid({
  items,
  copiedId,
  onCopy,
}: {
  items: SDK[];
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {items.map((sdk) => (
        <SDKCard
          key={sdk.id}
          sdk={sdk}
          copied={copiedId === sdk.id}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}

function SDKCard({
  sdk,
  copied,
  onCopy,
}: {
  sdk: SDK;
  copied: boolean;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-border-strong">
      {/* Header */}
      <header className="flex items-start gap-4 px-5 pt-5 pb-4">
        <div className="w-12 h-12 rounded-lg bg-subtle border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-mono font-bold tracking-tight text-foreground">
            {sdk.abbreviation}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground leading-snug">
            {sdk.language}
          </h3>
          <code className="text-[11px] font-mono text-muted-foreground block mt-0.5 truncate">
            {sdk.packageName}
          </code>
        </div>
      </header>

      {/* Description */}
      <p className="px-5 text-sm text-muted-foreground leading-relaxed">
        {sdk.description}
      </p>

      {/* Install command */}
      <div className="px-5 pt-4 pb-5">
        {sdk.install ? (
          <div className="flex items-stretch rounded-md border border-border bg-subtle overflow-hidden">
            <div className="flex items-center px-3 border-r border-border bg-card flex-shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {sdk.installManager}
              </span>
            </div>
            <code className="flex-1 min-w-0 px-3 py-2.5 text-xs font-mono text-foreground truncate flex items-center">
              {sdk.install}
            </code>
            <button
              type="button"
              onClick={() => onCopy(sdk.id, sdk.install!)}
              className="inline-flex items-center gap-1.5 px-3 border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Copy install command"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-md border border-dashed border-border bg-subtle/40">
            <p className="text-xs text-muted-foreground">
              {sdk.installNote ??
                'See repository for installation instructions.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-1 px-3 py-3 border-t border-border bg-subtle/40">
        {sdk.repo && (
          <a
            href={sdk.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Github className="w-3 h-3" />
            GitHub
            <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        )}
        {sdk.packageUrl && (
          <a
            href={sdk.packageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Package className="w-3 h-3" />
            {packageRegistryLabel(sdk)}
            <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        )}
      </footer>
    </article>
  );
}
