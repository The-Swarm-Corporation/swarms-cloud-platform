'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  X,
} from 'lucide-react';
import { APPS, APPS_DIRECTORY_ENTRY, type AppEntry } from '@/lib/apps-catalog';

export type NavSearchPage = AppEntry;

export const NAV_SEARCH_PAGES: NavSearchPage[] = [
  ...APPS,
  APPS_DIRECTORY_ENTRY,
];

function matchScore(page: NavSearchPage, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const label = page.label.toLowerCase();
  const description = page.description.toLowerCase();
  const haystack = [label, description, ...page.keywords.map((k) => k.toLowerCase())];

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (page.keywords.some((k) => k.toLowerCase() === q)) return 55;
  if (page.keywords.some((k) => k.toLowerCase().startsWith(q))) return 45;
  if (haystack.some((h) => h.includes(q))) return 30;
  return 0;
}

export function NavSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    return NAV_SEARCH_PAGES.map((page) => ({
      page,
      score: matchScore(page, query),
    }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.page);
  }, [query]);

  // Reset highlight when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Global shortcut: cmd/ctrl+K focuses the input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isModK) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
      router.push(href);
    },
    [router]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIdx];
      if (target) navigateTo(target.href);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
      } else {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md min-w-0">
      <div
        className={`relative w-full h-7 inline-flex items-center rounded-md border bg-card transition-colors ${
          open
            ? 'border-foreground/30 ring-1 ring-foreground/10'
            : 'border-border hover:border-foreground/20'
        }`}
      >
        <Search className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search pages…"
          aria-label="Search pages"
          aria-expanded={open}
          aria-controls="nav-search-results"
          className="flex-1 min-w-0 h-full px-2 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="inline-flex items-center justify-center w-5 h-5 mr-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="hidden md:inline-flex items-center gap-0.5 mr-1.5 flex-shrink-0">
            <kbd className="px-1 h-4 rounded border border-border bg-subtle text-[10px] font-mono text-muted-foreground inline-flex items-center">
              ⌘
            </kbd>
            <kbd className="px-1 h-4 rounded border border-border bg-subtle text-[10px] font-mono text-muted-foreground inline-flex items-center">
              K
            </kbd>
          </span>
        )}
      </div>

      {open && (
        <div
          id="nav-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 sm:left-auto sm:right-0 sm:w-[26rem]"
        >
          <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            <div className="max-h-80 overflow-y-auto sidebar-scroll">
              {results.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No pages match “{query}”.
                  </p>
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((page, idx) => {
                    const Icon = page.icon;
                    const isActive = idx === activeIdx;
                    return (
                      <li key={page.href}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseDown={(e) => {
                            // Prevent input blur before click registers
                            e.preventDefault();
                          }}
                          onClick={() => navigateTo(page.href)}
                          className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-muted text-foreground'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-md bg-subtle border border-border flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {page.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {page.description}
                            </div>
                          </div>
                          {isActive && (
                            <CornerDownLeft className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-3 h-8 border-t border-border bg-subtle text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="w-2.5 h-2.5" />
                  <ArrowDown className="w-2.5 h-2.5" />
                  Navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  Open
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 h-3.5 rounded border border-border bg-card text-[9px] font-mono inline-flex items-center">
                    ESC
                  </kbd>
                  Close
                </span>
              </div>
              <span>{results.length} pages</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
