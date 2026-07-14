'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import {
  buildSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLanguage,
} from '@/lib/api/snippets';

interface SnippetPreviewProps {
  endpoint: string;
  method?: 'POST' | 'GET';
  payload?: unknown;
  baseUrl?: string;
  title?: string;
  className?: string;
  defaultLanguage?: SnippetLanguage;
}

const DEFAULT_BASE_URL = 'https://api.swarms.world';

export function SnippetPreview({
  endpoint,
  method = 'POST',
  payload,
  baseUrl = DEFAULT_BASE_URL,
  title,
  className = '',
  defaultLanguage = 'curl',
}: SnippetPreviewProps) {
  const [lang, setLang] = useState<SnippetLanguage>(defaultLanguage);
  const [copied, setCopied] = useState(false);

  const code = useMemo(
    () => buildSnippet(lang, { baseUrl, endpoint, method, payload }),
    [lang, baseUrl, endpoint, method, payload]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`flex flex-col rounded-md border border-border bg-card overflow-hidden min-w-0 ${className}`}
    >
      <header className="flex items-center justify-between gap-2 px-3 h-9 border-b border-border bg-subtle/60">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-foreground truncate">
            {title ?? 'Request preview'}
          </h3>
          <code className="hidden sm:inline text-[10px] font-mono text-muted-foreground truncate">
            {method} {endpoint}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 h-6 px-2 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Copy snippet"
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
      </header>

      <div
        role="tablist"
        aria-label="Snippet language"
        className="flex items-center gap-0 border-b border-border bg-subtle/30 overflow-x-auto"
      >
        {SNIPPET_LANGUAGES.map((entry) => {
          const isActive = lang === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setLang(entry.id)}
              className={`relative inline-flex items-center px-3 h-8 text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {entry.label}
              {isActive && (
                <span className="absolute left-2 right-2 bottom-0 h-0.5 bg-accent rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>

      <pre className="px-3 py-3 text-[12px] leading-relaxed font-mono text-foreground bg-card overflow-auto flex-1 min-h-0 max-h-[420px] whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
    </div>
  );
}
