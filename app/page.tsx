'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { RateLimitCard } from '@/components/dashboard/RateLimitCard';
import { RecentAppsCard } from '@/components/dashboard/RecentAppsCard';
import { RecentAgentsCard } from '@/components/dashboard/RecentAgentsCard';
import { PremiumUpgradeCard } from '@/components/dashboard/PremiumUpgradeCard';
import { FreedomModeCard } from '@/components/dashboard/FreedomModeCard';
import { ExecutionHistoryPreview } from '@/components/dashboard/ExecutionHistoryPreview';
import { useRateLimits } from '@/lib/hooks/useRateLimits';
import { useAgentConfigsList } from '@/lib/hooks/useAgentConfigsList';
import { useSwarmLogs } from '@/lib/hooks/useSwarmLogs';
import { useCredits } from '@/lib/hooks/useCredits';
import {
  Users,
  XCircle,
  Zap,
  Calendar,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  Wallet,
} from 'lucide-react';

export default function DashboardPage() {
  const { rateLimits, isLoading, error, refetch } = useRateLimits();
  const { configs, refetch: refetchConfigs } = useAgentConfigsList();
  const { logs, refetch: refetchLogs } = useSwarmLogs();
  const { credits, refetch: refetchCredits } = useCredits();

  const metrics = useMemo(() => {
    return {
      totalAgents: configs.length,
      totalExecutions: logs.length,
    };
  }, [configs, logs]);

  const handleRefresh = () => {
    refetch();
    refetchConfigs();
    refetchLogs();
    refetchCredits();
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Overview</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Real-time analytics and rate-limit monitoring across your workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Primary metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <MetricsCard
              title="Total agents"
              value={metrics.totalAgents}
              icon={Users}
              subtitle="Configurations on file"
            />
            <MetricsCard
              title="Requests (24h)"
              value={rateLimits?.rate_limits.day.count ?? 0}
              icon={Calendar}
              subtitle={
                rateLimits
                  ? `of ${rateLimits.limits.maximum_requests_per_day.toLocaleString()} daily limit`
                  : 'API calls in the last 24h'
              }
            />
            <MetricsCard
              title="Completions"
              value={metrics.totalExecutions}
              icon={Zap}
              subtitle="All-time"
            />
            <MetricsCard
              title="Credit balance"
              value={credits ? `$${credits.total_credits.toFixed(2)}` : '—'}
              icon={Wallet}
              subtitle={
                credits
                  ? `$${credits.credit.toFixed(2)} paid · $${credits.free_credit.toFixed(2)} free`
                  : 'Loading…'
              }
            />
          </div>

          {/* Recently visited & called */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <RecentAppsCard />
            <RecentAgentsCard logs={logs} configs={configs} />
          </div>

          {/* Recent executions preview */}
          <div className="mb-6">
            <ExecutionHistoryPreview logs={logs} />
          </div>

          {/* Freedom Mode — free access until July 6, 11:59 PM PT */}
          <div className="mb-8">
            <FreedomModeCard />
          </div>

          {/* Rate limits */}
          <section className="mb-6">
            <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Rate limits
                </h2>
                <Link
                  href="/rate-limits"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View details
                </Link>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {rateLimits?.tier && (
                  <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md border border-border bg-subtle text-xs">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-medium text-foreground">
                      {rateLimits.tier.toUpperCase()}
                    </span>
                  </span>
                )}
                {rateLimits?.limits && (
                  <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md border border-border bg-subtle text-xs">
                    <span className="text-muted-foreground">Tokens / agent</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {rateLimits.limits.tokens_per_agent.toLocaleString()}
                    </span>
                  </span>
                )}
                {isProTier(rateLimits?.tier) ? (
                  <a
                    href="/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-border bg-card text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    Manage billing
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                ) : (
                  <a
                    href="https://swarms.world/platform/account?tab=subscription"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-accent/50 bg-accent/10 text-xs text-accent hover:bg-accent/20 transition-colors font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    Upgrade to Pro
                  </a>
                )}
              </div>
            </div>

            {isLoading && !rateLimits ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading rate limits…</p>
              </div>
            ) : error ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <RateLimitCard title="Per minute" window={rateLimits.rate_limits.minute} />
                <RateLimitCard title="Per hour" window={rateLimits.rate_limits.hour} />
                <RateLimitCard title="Per day" window={rateLimits.rate_limits.day} />
              </div>
            ) : null}
          </section>

          {/* Premium upgrade */}
          <div className="mb-8">
            <PremiumUpgradeCard currentTier={rateLimits?.tier} />
          </div>
        </div>
      </main>
    </div>
  );
}

function isProTier(tier: string | null | undefined): boolean {
  if (!tier) return false;
  const t = tier.toLowerCase();
  return t === 'pro' || t === 'premium' || t === 'enterprise';
}
