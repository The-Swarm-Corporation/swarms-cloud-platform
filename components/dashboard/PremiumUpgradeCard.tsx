'use client';

import React from 'react';
import {
  Crown,
  Building2,
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  Cpu,
  Network,
  GraduationCap,
} from 'lucide-react';

type Benefit = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type Variant = {
  badgeIcon: React.ComponentType<{ className?: string }>;
  badgeLabel: string;
  headline: string;
  subhead: string;
  blurb: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  benefits: Benefit[];
};

// Shown to Premium users — upsell to the Enterprise offering.
const ENTERPRISE_VARIANT: Variant = {
  badgeIcon: Building2,
  badgeLabel: 'Swarms Enterprise',
  headline: "You're on Premium.",
  subhead: 'Go Enterprise for dedicated scale.',
  blurb:
    'Move to Enterprise for even higher rate limits, 24/7 dedicated support, hands-on team training, and custom infrastructure. Built for organizations running mission-critical agents.',
  ctaLabel: 'Contact sales',
  ctaHref: 'mailto:kye@swarms.world?subject=Swarms%20Enterprise',
  secondaryLabel: 'See pricing',
  secondaryHref: 'https://docs.swarms.ai/docs/documentation/resources/pricing',
  benefits: [
    {
      icon: Zap,
      title: 'Even more rate limits',
      description: 'Custom, uncapped throughput provisioned for your workloads.',
    },
    {
      icon: Headphones,
      title: '24/7 dedicated support',
      description: 'A dedicated engineer and Slack channel with guaranteed SLAs.',
    },
    {
      icon: GraduationCap,
      title: 'Team training',
      description: 'Hands-on onboarding and training to get your team production-ready.',
    },
    {
      icon: Shield,
      title: 'Custom infrastructure',
      description: 'Dedicated deployments, security reviews, and compliance support.',
    },
  ],
};

// Shown to Pro users — upsell to Premium, framing the Pro → Premium jump.
const PREMIUM_PRO_VARIANT: Variant = {
  badgeIcon: Crown,
  badgeLabel: 'Swarms Premium',
  headline: "You're on Pro.",
  subhead: 'Go Premium to unlock everything.',
  blurb:
    'Upgrade to Premium for the highest rate limits, day-one access to the latest models, and multi-agent architectures. Cancel anytime.',
  ctaLabel: 'Upgrade to Premium',
  ctaHref: 'https://swarms.world/platform/account?tab=subscription',
  secondaryLabel: 'See pricing',
  secondaryHref: 'https://docs.swarms.ai/docs/documentation/resources/pricing',
  benefits: [
    {
      icon: Zap,
      title: 'More rate limits',
      description: 'The highest request ceilings on the platform — scale without throttling.',
    },
    {
      icon: Cpu,
      title: 'Latest models',
      description: 'Day-one access to the newest frontier models across every provider.',
    },
    {
      icon: Network,
      title: 'Multi-agent architectures',
      description: 'Run hierarchical, sequential, and graph swarms of coordinated agents.',
    },
  ],
};

// Shown to free-tier users — upsell to Premium.
const PREMIUM_DEFAULT_VARIANT: Variant = {
  badgeIcon: Crown,
  badgeLabel: 'Swarms Premium',
  headline: 'Scale without limits.',
  subhead: 'Built for production workloads.',
  blurb:
    'Upgrade to Premium for higher rate limits, priority compute, and white-glove support. Cancel anytime.',
  ctaLabel: 'Upgrade to Premium',
  ctaHref: 'https://swarms.world/platform/account?tab=subscription',
  secondaryLabel: 'See pricing',
  secondaryHref: 'https://docs.swarms.ai/docs/documentation/resources/pricing',
  benefits: [
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
  ],
};

type Props = {
  currentTier?: string | null;
};

export function PremiumUpgradeCard({ currentTier }: Props) {
  const tier = currentTier?.toLowerCase();

  // Nothing left to upsell above Enterprise.
  if (tier === 'enterprise') return null;

  const variant =
    tier === 'premium'
      ? ENTERPRISE_VARIANT
      : tier === 'pro'
        ? PREMIUM_PRO_VARIANT
        : PREMIUM_DEFAULT_VARIANT;

  const BadgeIcon = variant.badgeIcon;
  const isMailto = variant.ctaHref.startsWith('mailto:');

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
            <BadgeIcon className="w-3 h-3 text-warning" />
            {variant.badgeLabel}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            {variant.headline}
            <br />
            <span className="text-muted-foreground">{variant.subhead}</span>
          </h2>

          <p className="text-sm text-muted-foreground max-w-md">{variant.blurb}</p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <a
              href={variant.ctaHref}
              {...(isMailto
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {variant.ctaLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href={variant.secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {variant.secondaryLabel}
            </a>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-3">
          {variant.benefits.map((b) => {
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
