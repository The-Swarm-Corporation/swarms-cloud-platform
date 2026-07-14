'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { AuthError, Provider } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { grantSignupCredits } from '@/lib/billing/credits';

function getSiteOrigin(headerOrigin: string | null): string {
  if (headerOrigin) return headerOrigin;
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return 'http://localhost:3000';
}

// Map Supabase auth error codes to safe user-facing strings. Any unmapped code
// gets the generic message; the original error is logged server-side.
const SAFE_AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email before signing in.',
  email_address_invalid: 'That email address is not valid.',
  email_exists: 'An account with that email already exists.',
  user_already_exists: 'An account with that email already exists.',
  weak_password: 'Password is too weak. Use at least 8 characters.',
  same_password: 'New password must be different from the current one.',
  signup_disabled: 'Sign-up is currently disabled.',
  email_provider_disabled: 'Email sign-in is currently disabled.',
  over_email_send_rate_limit:
    'Too many email requests. Please wait a moment and try again.',
  over_request_rate_limit:
    'Too many requests. Please wait a moment and try again.',
  otp_expired: 'That link or code has expired. Please request a new one.',
  otp_disabled: 'One-time codes are currently disabled.',
};

const GENERIC_AUTH_MESSAGE =
  'We could not complete that request. Please try again.';

function safeAuthError(context: string, error: AuthError): string {
  console.error(`[${context}]`, error);
  const code = (error as AuthError & { code?: string }).code;
  if (code && SAFE_AUTH_MESSAGES[code]) return SAFE_AUTH_MESSAGES[code];
  return GENERIC_AUTH_MESSAGE;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signInWithPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: safeAuthError('auth/signin', error) };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUpWithPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const origin = getSiteOrigin((await headers()).get('origin'));

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { ok: false, error: safeAuthError('auth/signup', error) };
  }

  if (data.session) {
    const admin = createAdminClient();
    if (admin) await grantSignupCredits(admin, data.session.user.id);

    revalidatePath('/', 'layout');
    redirect('/');
  }

  return { ok: true };
}

export async function signInWithMagicLinkAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = await createClient();
  const origin = getSiteOrigin((await headers()).get('origin'));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: safeAuthError('auth/magic-link', error) };
  }
  return { ok: true };
}

export async function signInWithOAuthAction(
  provider: Provider,
): Promise<AuthResult> {
  const supabase = await createClient();
  const origin = getSiteOrigin((await headers()).get('origin'));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { ok: false, error: safeAuthError('auth/oauth', error) };
  }
  if (data?.url) redirect(data.url);
  return { ok: false, error: GENERIC_AUTH_MESSAGE };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
