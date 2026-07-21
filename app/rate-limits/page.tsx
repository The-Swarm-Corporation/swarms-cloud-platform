'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useRateLimits } from '@/lib/hooks/useRateLimits';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { RateLimitWindow } from '@/types/api';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  Gauge,
  Info,
} from 'lucide-react';

export default function RateLimitsPage() {
  const { rateLimits, isLoading, error, refetch } = useRateLimits();
  const hydrated = useIsHydrated();

  // 1s ticker so the reset countdowns tick down live between refetches.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isPro = isProTier(rateLimits?.tier);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Account</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Rate limits
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Live usage across your minute, hour, and day windows: exactly
                when each one resets.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={refetch}
                disabled={isLoading}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {isPro ? (
                <a
                  href="/settings"
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors"
                >
                  Manage billing
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href="https://swarms.world/platform/account?tab=subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade
                </a>
              )}
            </div>
          </div>

          {isLoading && !rateLimits ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading rate limits…</p>
            </div>
          ) : error && !rateLimits ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : rateLimits ? (
            <>
              {/* Account summary */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {rateLimits.tier && (
                  <span className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md border border-border bg-subtle text-xs">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-medium text-foreground">
                      {rateLimits.tier.toUpperCase()}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md border border-border bg-subtle text-xs">
                  <span className="text-muted-foreground">Tokens / agent</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {rateLimits.limits.tokens_per_agent.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Window cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <WindowCard
                  title="Per minute"
                  window={rateLimits.rate_limits.minute}
                  now={now}
                  hydrated={hydrated}
                />
                <WindowCard
                  title="Per hour"
                  window={rateLimits.rate_limits.hour}
                  now={now}
                  hydrated={hydrated}
                />
                <WindowCard
                  title="Per day"
                  window={rateLimits.rate_limits.day}
                  now={now}
                  hydrated={hydrated}
                />
              </div>

              {/* How it works */}
              <section className="rounded-lg border border-border bg-card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    How rate limits work
                  </h2>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <li className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      Three rolling windows
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Every API request counts against your per-minute, per-hour,
                      and per-day windows at the same time. Each window resets
                      independently on the schedule shown above.
                    </span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      When a limit is exceeded
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Requests beyond a window&apos;s limit are rejected with a{' '}
                      <code className="px-1 py-0.5 rounded bg-subtle border border-border text-[11px]">
                        429
                      </code>{' '}
                      response until that window resets. Your other windows are
                      unaffected.
                    </span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      Limits scale with your tier
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Free, Pro, and Premium tiers each raise the ceiling on all
                      three windows and on tokens per agent. Upgrading applies
                      immediately, no redeploy needed.
                    </span>
                  </li>
                </ul>
              </section>

              {/* Upgrade CTA */}
              {!isPro && (
                <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 60% at 80% 0%, rgba(0, 112, 243, 0.14), transparent 70%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(168, 85, 247, 0.12), transparent 70%)',
                    }}
                  />
                  <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-accent" />
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          Need more headroom?
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-lg">
                        Upgrade to raise all three rate-limit windows (up to 10×
                        more requests per minute and 50× more per day) plus
                        priority compute during peak traffic.
                      </p>
                    </div>
                    <a
                      href="https://swarms.world/platform/account?tab=subscription"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto flex-shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Upgrade now
                    </a>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function WindowCard({
  title,
  window: win,
  now,
  hydrated,
}: {
  title: string;
  window: RateLimitWindow;
  now: number;
  hydrated: boolean;
}) {
  const percentage = win.limit > 0 ? (win.count / win.limit) * 100 : 0;
  const isWarning = percentage >= 75;
  const isExceeded = win.exceeded;

  const barColor = isExceeded ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success';
  const tone = isExceeded ? 'text-danger' : isWarning ? 'text-warning' : 'text-foreground';

  const resetMs = Date.parse(win.reset_time) - now;
  const resetsAt = formatResetsAt(win.reset_time);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {isExceeded ? (
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {title}
          </span>
        </div>
        {isExceeded && (
          <span className="text-[11px] text-danger font-medium uppercase tracking-wider">
            Exceeded
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className={`text-3xl font-semibold tabular-nums tracking-tight ${tone}`}>
          {win.count.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          / {win.limit.toLocaleString()} requests
        </span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-[width] duration-300 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className={`tabular-nums font-medium ${tone}`}>
            {win.remaining.toLocaleString()}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Resets in</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {hydrated ? formatCountdown(resetMs) : '-'}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Resets at</dt>
          <dd className="tabular-nums text-muted-foreground">
            {hydrated ? resetsAt : '-'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms)) return '-';
  if (ms <= 0) return 'Now';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatResetsAt(resetTime: string): string {
  const ts = Date.parse(resetTime);
  if (Number.isNaN(ts)) return resetTime;
  const date = new Date(ts);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  if (sameDay) return time;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

function isProTier(tier: string | null | undefined): boolean {
  if (!tier) return false;
  const t = tier.toLowerCase();
  return t === 'pro' || t === 'premium' || t === 'enterprise';
}
