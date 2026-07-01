import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/** Resolve the currently authenticated Supabase user, or null. */
export async function getAuthedUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}
