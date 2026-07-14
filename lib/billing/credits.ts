import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Free credit granted to a new user on sign-up, in USD. */
export const SIGNUP_FREE_CREDIT = 5;

/**
 * Grant the one-time sign-up free credit to a user. Idempotent: uses
 * `ignoreDuplicates` on the `user_id` unique constraint so repeat calls
 * (e.g. every magic-link/OAuth login hitting the same callback route)
 * never overwrite an existing credits row.
 */
export async function grantSignupCredits(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await admin.from('swarms_cloud_users_credits').upsert(
    {
      user_id: userId,
      free_credit: SIGNUP_FREE_CREDIT,
      credit_grant: SIGNUP_FREE_CREDIT,
    },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('[billing] failed to grant signup credits', error);
  }
}
