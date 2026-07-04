'use client';

import React from 'react';
import { Flag, ArrowRight, Zap, Unlock, Cpu } from 'lucide-react';

// July 6 at 11:59:59 PM PT (PDT, UTC-7)
const FREEDOM_MODE_ENDS_AT = Date.parse('2026-07-07T06:59:59Z');

type Benefit = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: Zap,
    title: 'All API requests are free',
    description: 'Every Swarms API request is free for every user — no credits, no limits.',
  },
  {
    icon: Unlock,
    title: 'Pro & Premium unlocked',
    description: 'Pro and Premium endpoints are fully unlocked across the platform.',
  },
  {
    icon: Cpu,
    title: 'Thousands of models',
    description: 'Fable, GPT-5.5, Opus, and more — all available at no cost.',
  },
];

export function FreedomModeCard() {
  if (Date.now() > FREEDOM_MODE_ENDS_AT) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 80% 0%, rgba(239, 68, 68, 0.16), transparent 70%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(59, 130, 246, 0.16), transparent 70%)',
        }}
      />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border border-border bg-subtle text-[11px] font-medium tracking-wide uppercase text-foreground">
            <Flag className="w-3 h-3 text-red-500" />
            Freedom Mode 👾🇺🇸
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Full access. Free for everyone.
            <br />
            <span className="text-muted-foreground">Until July 6 at 11:59 PM PT.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            In celebration of Independence Day, we&apos;re opening up full access to Swarms Cloud
            for a limited time. Build, benchmark, and iterate on agents without worrying about
            credits or limits. No barriers. No cost. Just building.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <a
              href="https://docs.swarms.ai/docs/documentation/getting-started/quickstart"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://docs.swarms.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Read the docs
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
                  <Icon className="w-3.5 h-3.5 text-red-500" />
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-foreground">{b.title}</span>
                  <span className="text-xs text-muted-foreground">{b.description}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
