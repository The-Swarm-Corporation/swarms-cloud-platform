import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { grantSignupCredits } from '@/lib/billing/credits';

function safeNext(value: string | null): string {
  // Only allow same-origin paths starting with a single `/`.
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        const admin = createAdminClient();
        if (admin) await grantSignupCredits(admin, data.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Log the full Supabase error server-side; never echo it to the client URL.
    console.error('[auth/callback] exchangeCodeForSession failed', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
