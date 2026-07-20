import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { SwarmsMark } from './BrandMarks';

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex bg-background text-foreground">
      {/* Left, form column */}
      <div className="relative flex flex-col w-full lg:w-1/2 min-h-screen min-h-[100dvh] px-6 sm:px-10 lg:px-14 py-6">
        {/* Top-left logo */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="Swarms home"
          >
            <SwarmsMark className="w-7 h-7" />
            <span className="text-sm font-semibold tracking-tight">Swarms</span>
          </Link>

          {/* Workspace selector pill (visual-only) */}
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border bg-subtle text-xs text-muted-foreground"
            aria-label="Workspace selector (placeholder)"
            title="Workspace selector (coming soon)"
          >
            <span>You are signing into</span>
            <span className="font-medium text-foreground">Swarms</span>
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Centered form block */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Legal footer */}
        <p className="mx-auto max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing, you agree to Swarms&apos;{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Right, hero panel */}
      <aside
        className="relative hidden lg:flex w-1/2 items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(245, 7, 12, 0.18) 0%, rgba(0,0,0,0) 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        />
        <div className="relative flex items-center justify-center">
          <SwarmsMark className="w-72 h-72 opacity-95 drop-shadow-[0_0_60px_rgba(245,7,12,0.35)]" />
        </div>
      </aside>
    </div>
  );
}
