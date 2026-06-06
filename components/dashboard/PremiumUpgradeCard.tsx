'use client';

import React from 'react';
import { Crown, ArrowRight, Zap, Shield, Headphones } from 'lucide-react';

type Benefit = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: Zap,
    title: 'Higher rate limits',
    description: '10× requests per minute and 50× per day.',
  },
  {
    icon: Shield,
    title: 'Priority compute',
    description: 'Dedicated lane during peak traffic — no queueing.',
  },
  {
    icon: Headphones,
    title: 'Priority support',
    description: '24/7 real-time personal support.',
  },
];

type Props = {
  currentTier?: string | null;
};

export function PremiumUpgradeCard({ currentTier }: Props) {
  const isPremium = currentTier?.toLowerCase() === 'premium';
  if (isPremium) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 80% 0%, rgba(245, 158, 11, 0.18), transparent 70%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(168, 85, 247, 0.14), transparent 70%)',
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border border-border bg-subtle text-[11px] font-medium tracking-wide uppercase text-foreground">
            <Crown className="w-3 h-3 text-warning" />
            Swarms Premium
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Scale without limits.
            <br />
            <span className="text-muted-foreground">
              Built for production workloads.
            </span>
          </h2>

          <p className="text-sm text-muted-foreground max-w-md">
            Upgrade to Premium for higher rate limits, priority compute, and
            white-glove support. Cancel anytime.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <a
              href="https://swarms.world/platform/account?tab=subscription"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://docs.swarms.ai/docs/documentation/resources/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See pricing
            </a>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <li
                key={b.title}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-subtle/60 backdrop-blur"
              >
                <span className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-warning" />
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {b.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {b.description}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
