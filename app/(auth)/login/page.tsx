import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthForm } from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Log in',
  description:
    'Log into your Swarms Cloud account to manage AI agents, run multi-agent swarms, and monitor executions.',
  path: '/login',
  keywords: ['Swarms login', 'Swarms Cloud sign in', 'Swarms account'],
});

// Map opaque error codes from `/auth/callback` to safe user-facing copy.
// We never render an arbitrary `error` query value because callers (or
// attackers) can stuff anything in there.
const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'We could not sign you in. Please try again.',
  missing_code: 'That sign-in link is incomplete. Please start again.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/');
  }

  const { error } = await searchParams;
  const initialError = error ? ERROR_MESSAGES[error] ?? null : null;

  return (
    <AuthShell>
      <AuthForm mode="login" initialError={initialError} />
    </AuthShell>
  );
}
