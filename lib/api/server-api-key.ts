import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Resolve the Swarms API key for the current request. Resolution order:
 *   1. The first non-deleted key in `swarms_cloud_api_keys` owned by the
 *      currently authenticated Supabase user.
 *   2. `process.env.SWARMS_API_KEY` (dev / system fallback).
 *
 * The key is never sourced from a request header — that would let a signed-in
 * user impersonate another user's key by spoofing `x-api-key`.
 */
export async function resolveApiKey(): Promise<string | null> {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (hasSupabaseEnv) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('[resolveApiKey] auth.getUser error', {
          message: userError.message,
        });
      }

      if (user) {
        const admin = createAdminClient();
        if (!admin) {
          console.warn('[resolveApiKey] service role client unavailable', {
            hasServiceRoleKey: Boolean(
              process.env.SUPABASE_SERVICE_ROLE_KEY,
            ),
          });
        } else {
          const { data, error: queryError } = await admin
            .from('swarms_cloud_api_keys')
            .select('key')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (queryError) {
            console.error('[resolveApiKey] keys query error', {
              userId: user.id,
              code: queryError.code,
              message: queryError.message,
              details: queryError.details,
            });
          } else if (!data?.key) {
            console.warn('[resolveApiKey] no key row for user', {
              userId: user.id,
            });
          }

          if (data?.key) return data.key;
        }
      } else {
        console.warn('[resolveApiKey] no authenticated user on request');
      }
    } catch (err) {
      console.error('[resolveApiKey] unexpected error', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    console.warn('[resolveApiKey] supabase env vars missing', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
  }

  const envFallback = process.env.SWARMS_API_KEY ?? null;
  if (!envFallback) {
    console.warn('[resolveApiKey] no env fallback SWARMS_API_KEY set');
  }
  return envFallback;
}
