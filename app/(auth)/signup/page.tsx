import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthForm } from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Sign up | Start Building Multi-Agent AI Free',
  description:
    'Create a free Swarms Cloud account and start building, deploying, and scaling AI agents and multi-agent swarms in minutes. Free credits included.',
  path: '/signup',
  keywords: [
    'Swarms sign up',
    'create Swarms account',
    'free AI agent platform',
    'get started with AI agents',
    'free API credits',
  ],
});

export default async function SignupPage({
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

  return (
    <AuthShell>
      <AuthForm mode="signup" initialError={error ?? null} />
    </AuthShell>
  );
}
