'use client';

import React, { useTransition } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { useCredits } from '@/lib/hooks/useCredits';
import { useProfile, getInitials } from '@/lib/hooks/useProfile';
import { BillingSection } from '@/components/settings/BillingSection';
import { signOutAction } from '@/lib/auth/actions';
import { clearUserScopedStorage } from '@/lib/auth/client-storage';
import {
  Palette,
  Wallet,
  RefreshCw,
  Loader2,
  XCircle,
  ExternalLink,
  LogOut,
  UserRound,
} from 'lucide-react';

export default function SettingsPage() {
  const { credits, isLoading: creditsLoading, error: creditsError, refetch: refetchCredits } =
    useCredits();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();

  const [isSigningOut, startSignOut] = useTransition();

  const handleSignOut = () => {
    startSignOut(async () => {
      clearUserScopedStorage();
      await signOutAction();
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Workspace</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage authentication and runtime preferences.
            </p>
          </div>

          {/* Profile section */}
          <section className="mb-6 rounded-lg border border-border bg-card">
            <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
              <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 mt-0.5">
                <UserRound className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Profile
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your Swarms account identity on this device.
                </p>
              </div>
            </header>

            <div className="p-5">
              {profileLoading && !profile ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-subtle border border-border animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-subtle animate-pulse" />
                    <div className="h-3 w-56 rounded bg-subtle animate-pulse" />
                  </div>
                </div>
              ) : profileError ? (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-3 text-sm text-danger">
                  {profileError}
                </div>
              ) : !profile ? (
                <div className="rounded-md border border-dashed border-border bg-subtle/50 px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    You&apos;re not signed in.{' '}
                    <a href="/login" className="text-accent hover:underline">
                      Log in
                    </a>{' '}
                    to view your profile.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || profile.username || 'Avatar'}
                      className="w-14 h-14 rounded-full border border-border object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-14 h-14 rounded-full border border-border bg-subtle text-foreground flex items-center justify-center text-sm font-semibold tracking-tight flex-shrink-0"
                    >
                      {getInitials(profile)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold text-foreground truncate">
                        {profile.full_name ||
                          profile.username ||
                          profile.email ||
                          'Signed in'}
                      </span>
                      {profile.tier && (
                        <span className="inline-flex items-center px-1.5 h-5 rounded-sm border border-border bg-subtle text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {profile.tier}
                        </span>
                      )}
                    </div>
                    {profile.email && (
                      <div className="text-sm text-muted-foreground truncate">
                        {profile.email}
                      </div>
                    )}
                    {profile.username && (
                      <div className="text-xs text-muted-foreground truncate">
                        @{profile.username}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Credits section */}
          <section className="mb-6 rounded-lg border border-border bg-card">
            <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
              <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 mt-0.5">
                <Wallet className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Credits
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Balance across paid, free, and referral credits. Refreshes every
                  30 seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={refetchCredits}
                disabled={creditsLoading}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                aria-label="Refresh credits"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${creditsLoading ? 'animate-spin' : ''}`}
                />
              </button>
            </header>

            <div className="p-5 space-y-4">
              {!credits && !creditsError ? (
                <div className="rounded-md border border-border bg-subtle px-3 py-6 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Loading credits…</p>
                </div>
              ) : creditsError ? (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-4 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{creditsError}</p>
                    <button
                      type="button"
                      onClick={refetchCredits}
                      className="text-xs text-accent hover:underline mt-1"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : credits ? (
                <>
                  <div className="rounded-md border border-border bg-subtle px-4 py-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Total balance
                    </div>
                    <div className="text-3xl font-semibold tabular-nums text-foreground">
                      ${credits.total_credits.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CreditStat label="Paid" value={credits.credit} />
                    <CreditStat label="Free" value={credits.free_credit} />
                    <CreditStat label="Referral" value={credits.referral_credits} />
                  </div>

                  {credits.total_credits < 1 && (
                    <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                      Your balance is low. Top up to keep running agents and swarms.
                    </div>
                  )}
                </>
              ) : null}

              <div className="pt-1">
                <a
                  href="https://swarms.world/platform/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors"
                >
                  Manage billing
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* Subscription section */}
          <BillingSection />

          {/* Appearance section */}
          <section className="mb-6 rounded-lg border border-border bg-card">
            <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
              <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 mt-0.5">
                <Palette className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Appearance
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose how Orchestrate looks. Follows your system by default.
                </p>
              </div>
            </header>

            <div className="p-5">
              <ThemeSwitcher compact={false} />
            </div>
          </section>

          {/* Account section */}
          <section className="rounded-lg border border-border bg-card">
            <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
              <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 mt-0.5">
                <UserRound className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Account
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your plan tier and session controls.
                </p>
              </div>
            </header>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-subtle px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Tier
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Your current Swarms plan.
                  </div>
                </div>
                {profileLoading && !profile ? (
                  <div className="h-6 w-16 rounded-md bg-muted animate-pulse" />
                ) : (
                  <span className="inline-flex items-center px-2 h-6 rounded-md border border-border bg-card text-xs font-medium uppercase tracking-wider text-foreground tabular-nums">
                    {profile?.tier?.trim() || 'Free'}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-describedby="settings-signout-hint"
              >
                {isSigningOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </Button>
              <span id="settings-signout-hint" className="sr-only">
                Ends your current session on this device and returns you to the
                login page.
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CreditStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-subtle px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums text-foreground">
        ${value.toFixed(2)}
      </div>
    </div>
  );
}
