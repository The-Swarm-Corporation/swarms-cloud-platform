'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiFetch } from '@/lib/api/client-fetch';
import { AUTO_CREATED_KEY_NAME } from '@/lib/api/api-key-constants';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { useApiKeys, type ApiKeyRow } from '@/lib/hooks/useApiKeys';
import { useProfile } from '@/lib/hooks/useProfile';
import {
  API_KEY_CREATED_EVENT,
  useOnboardingStore,
  type OnboardingStep,
} from '@/lib/store/onboarding-store';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  Check,
  KeyRound,
  Rocket,
  Terminal,
  Workflow,
  X,
} from 'lucide-react';

const DOCS_URL = 'https://docs.swarms.ai';

// Mirrors PUBLIC_PATH_PREFIXES in lib/supabase/middleware.ts. Kept as a copy
// because that module pulls @supabase/ssr into whatever imports it.
const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/auth',
  '/terms',
  '/privacy',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** A key the user made themselves, as opposed to the auto-provisioned one. */
function isUserCreatedKey(key: ApiKeyRow): boolean {
  return key.name !== AUTO_CREATED_KEY_NAME;
}

const STEPS: {
  step: OnboardingStep;
  title: string;
  description: string;
  icon: typeof KeyRound;
}[] = [
  {
    step: 1,
    title: 'Create an API key',
    description:
      'We made you a "Default" key for the dashboard — create your own to call the Swarms API from your apps.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Find your models',
    description:
      'Browse the catalog and pick the models your agents will run on.',
    icon: Boxes,
  },
  {
    step: 3,
    title: 'Try the playground',
    description: 'Configure and run your first agent right from the browser.',
    icon: Terminal,
  },
  {
    step: 4,
    title: 'Keep exploring',
    description: 'Discover agents, workflows, and the docs.',
    icon: Rocket,
  },
];

/**
 * Guided first-run flow for accounts with no self-created API key (i.e.
 * first sign-up, or nothing beyond the auto-provisioned "Default" key):
 * welcome modal → create an API key → find your models → try the playground
 * → final "keep exploring" modal. Mounted once in the root layout.
 */
export function OnboardingWizard() {
  const hydrated = useIsHydrated();
  const pathname = usePathname();

  if (!hydrated || isPublicPath(pathname)) return null;
  return <OnboardingController pathname={pathname} />;
}

function OnboardingController({ pathname }: { pathname: string }) {
  const { profile, isLoading } = useProfile();
  const status = useOnboardingStore((s) => s.status);
  const storedUserId = useOnboardingStore((s) => s.userId);
  const syncUser = useOnboardingStore((s) => s.syncUser);

  useEffect(() => {
    if (profile) syncUser(profile.id);
  }, [profile, syncUser]);

  // Wait until the persisted state is bound to the signed-in user, so a
  // previous account's progress on this browser never applies.
  if (isLoading || !profile || storedUserId !== profile.id) return null;

  if (status === 'unseen') return <EligibilityCheck />;
  if (status === 'active') return <OnboardingFlow pathname={pathname} />;
  return null;
}

/**
 * Decides once whether the wizard applies: starts it for any account that has
 * no self-created API key (the auto-provisioned "Default" key doesn't count).
 * A brand-new signup necessarily has no self-created key, so first-time users
 * always get the tour. Anyone with their own key is marked completed so this
 * fetch never runs again for this user on this browser.
 */
function EligibilityCheck() {
  const { keys, isLoading: keysLoading, error: keysError } = useApiKeys();
  const start = useOnboardingStore((s) => s.start);
  const complete = useOnboardingStore((s) => s.complete);

  useEffect(() => {
    if (keysLoading) return;
    // Inconclusive on fetch errors — retry on the next full page load.
    if (keysError || keys === null) return;

    if (keys.some(isUserCreatedKey)) {
      complete();
    } else {
      start();
    }
  }, [keysLoading, keys, keysError, start, complete]);

  return null;
}

function OnboardingFlow({ pathname }: { pathname: string }) {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step);
  const welcomeSeen = useOnboardingStore((s) => s.welcomeSeen);
  const markWelcomeSeen = useOnboardingStore((s) => s.markWelcomeSeen);
  const advance = useOnboardingStore((s) => s.advance);
  const dismiss = useOnboardingStore((s) => s.dismiss);
  const complete = useOnboardingStore((s) => s.complete);

  return (
    <>
      {step === 1 && <KeyCreationWatcher pathname={pathname} />}

      {/* Step 0: intro modal */}
      <Modal
        isOpen={!welcomeSeen && step === 1}
        onClose={dismiss}
        title="Welcome to Swarms Cloud"
        footer={
          <>
            <Button variant="outline" size="md" onClick={dismiss}>
              Skip tour
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                markWelcomeSeen();
                router.push('/api-keys');
              }}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Create your API key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let&apos;s get you up and running in a few quick steps, then
            we&apos;ll point you at everything else the cloud can do.
          </p>
          <ol className="space-y-3">
            {STEPS.map(({ step: s, title, description, icon: Icon }) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border border-border bg-subtle flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Modal>

      {/* Steps 1–3: compact progress card */}
      {welcomeSeen && step < 4 && (
        <StepCard
          step={step}
          pathname={pathname}
          onDismiss={dismiss}
          onNavigate={(path) => router.push(path)}
          onAdvance={advance}
        />
      )}

      {/* Step 4: final modal */}
      <Modal
        isOpen={step === 4}
        onClose={complete}
        title="You're all set"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.open(DOCS_URL, '_blank', 'noopener')}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read the docs
            </Button>
            <Button variant="primary" size="md" onClick={complete}>
              <Rocket className="w-3.5 h-3.5" />
              Keep exploring
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              API key created
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Models discovered
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Playground explored
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            There&apos;s a lot more to the cloud — here are some good next
            stops:
          </p>
          <div className="space-y-2">
            <ExploreLink
              icon={Bot}
              title="Build your agents"
              description="Create reusable agent configurations you can run anywhere."
              onClick={() => {
                complete();
                router.push('/agents');
              }}
            />
            <ExploreLink
              icon={Workflow}
              title="Design multi-agent workflows"
              description="Chain agents together visually in the workflow builder."
              onClick={() => {
                complete();
                router.push('/workflow-builder');
              }}
            />
            <ExploreLink
              icon={BookOpen}
              title="Read the documentation"
              description="Guides, API reference, and examples at docs.swarms.ai."
              onClick={() => {
                complete();
                window.open(DOCS_URL, '_blank', 'noopener');
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * While on step 1, watches for the user's first self-created API key (the
 * auto-provisioned "Default" key doesn't count): reacts instantly to the
 * creation event from the API keys page, and re-checks the server on mount
 * and on navigation to cover creation from another tab or a reload.
 */
function KeyCreationWatcher({ pathname }: { pathname: string }) {
  const advance = useOnboardingStore((s) => s.advance);

  useEffect(() => {
    const onCreated = () => advance(2);
    window.addEventListener(API_KEY_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(API_KEY_CREATED_EVENT, onCreated);
  }, [advance]);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/api-keys')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const keys: ApiKeyRow[] = data?.keys ?? [];
        if (!cancelled && keys.some(isUserCreatedKey)) advance(2);
      })
      .catch(() => {
        // Inconclusive; the event listener and the next check still cover us.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, advance]);

  return null;
}

/**
 * Per-step card content: what to say, and the primary action. Steps 2 and 3
 * advance manually once the user is on the destination page; step 1 advances
 * automatically when a key is created (see KeyCreationWatcher).
 */
function stepCardContent(
  step: OnboardingStep,
  pathname: string,
): {
  title: string;
  body: string;
  action?: { label: string; icon: typeof KeyRound; run: 'navigate' | 'advance'; to: string | OnboardingStep };
} {
  if (step === 1) {
    if (pathname === '/api-keys') {
      return {
        title: 'Create your API key',
        body: 'Use the "Create key" button above and copy your new key — we’ll move on automatically once it’s made.',
      };
    }
    return {
      title: 'Create your API key',
      body: 'Head to the API keys page to create a key you can use from your own apps.',
      action: { label: 'Go to API keys', icon: KeyRound, run: 'navigate', to: '/api-keys' },
    };
  }
  if (step === 2) {
    if (pathname === '/models' || pathname.startsWith('/models/')) {
      return {
        title: 'Find your favorite models',
        body: 'Browse the catalog and open a few models that fit your use case — your agents can run on any of them.',
        action: { label: 'Next: the playground', icon: ArrowRight, run: 'advance', to: 3 },
      };
    }
    return {
      title: 'Key created — nice!',
      body: 'Next: browse the model catalog and find the models you want your agents to use.',
      action: { label: 'Browse the models', icon: Boxes, run: 'navigate', to: '/models' },
    };
  }
  if (pathname === '/playground') {
    return {
      title: 'Run your first agent',
      body: 'Pick one of the models you liked, give the agent a task, and run it. Finish the tour whenever you’re ready.',
      action: { label: 'Finish tour', icon: Check, run: 'advance', to: 4 },
    };
  }
  return {
    title: 'One last stop',
    body: 'Next up: the playground, where you can run agents on the models you just found.',
    action: { label: 'Open the playground', icon: ArrowRight, run: 'navigate', to: '/playground' },
  };
}

function StepCard({
  step,
  pathname,
  onDismiss,
  onNavigate,
  onAdvance,
}: {
  step: OnboardingStep;
  pathname: string;
  onDismiss: () => void;
  onNavigate: (path: string) => void;
  onAdvance: (step: OnboardingStep) => void;
}) {
  const { title, body, action } = stepCardContent(step, pathname);
  const ActionIcon = action?.icon;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card text-card-foreground shadow-lg animate-slide-up"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        right: 'max(1rem, env(safe-area-inset-right))',
      }}
      role="dialog"
      aria-label="Getting started"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Getting started · Step {step} of {STEPS.length}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mr-1"
          aria-label="Skip tour"
          title="Skip tour"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-4 pt-2">
        {STEPS.map(({ step: s }) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s < step ? 'bg-success' : s === step ? 'bg-foreground' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>

        {action && ActionIcon && (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() =>
              action.run === 'navigate'
                ? onNavigate(action.to as string)
                : onAdvance(action.to as OnboardingStep)
            }
          >
            <ActionIcon className="w-3.5 h-3.5" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function ExploreLink({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-md border border-border bg-subtle px-3 py-2.5 text-left hover:bg-muted transition-colors"
    >
      <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-md border border-border bg-card flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
