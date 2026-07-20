import crypto from 'crypto';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUTO_CREATED_KEY_NAME } from '@/lib/api/api-key-constants';

export function generateApiKey(): string {
  // Matches the swarms.world key format: "sk-" + 64 hex chars.
  return `sk-${crypto.randomBytes(32).toString('hex')}`;
}

// One auto-creation per user at a time: the first dashboard load fires several
// API routes in parallel, and each would otherwise race to insert a key.
const inFlightCreates = new Map<string, Promise<string | null>>();

/**
 * Return the user's newest active API key, creating one (named
 * `AUTO_CREATED_KEY_NAME`) if the user has none. Every signed-in user is
 * guaranteed a key of their own - there is deliberately no shared fallback.
 */
export async function ensureApiKeyForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  // `is_deleted` is nullable with default false. Legacy rows can be NULL, and
  // `eq(is_deleted, false)` excludes NULL because in SQL `NULL = false` is
  // NULL, not true. Filter for "not true" instead so both false and null rows
  // are kept.
  const { data, error } = await admin
    .from('swarms_cloud_api_keys')
    .select('key')
    .eq('user_id', userId)
    .not('is_deleted', 'is', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[ensureApiKeyForUser] keys query error', {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return null;
  }

  if (data?.key) return data.key;

  const pending = inFlightCreates.get(userId);
  if (pending) return pending;

  const create = (async (): Promise<string | null> => {
    try {
      const key = generateApiKey();
      const { error: insertError } = await admin
        .from('swarms_cloud_api_keys')
        .insert({ name: AUTO_CREATED_KEY_NAME, key, user_id: userId });

      if (insertError) {
        console.error('[ensureApiKeyForUser] auto-create insert error', {
          userId,
          code: insertError.code,
          message: insertError.message,
        });
        return null;
      }

      console.info('[ensureApiKeyForUser] auto-created key for user', {
        userId,
      });
      return key;
    } finally {
      inFlightCreates.delete(userId);
    }
  })();

  inFlightCreates.set(userId, create);
  return create;
}

/**
 * Resolve the Swarms API key for the current request: the signed-in user's
 * own key from `swarms_cloud_api_keys`, auto-created on first use if missing.
 *
 * Returns null when there is no authenticated user - there is no environment
 * fallback, because a shared key would let one account see another account's
 * upstream data. The key is also never sourced from a request header - that
 * would let a signed-in user impersonate another user's key by spoofing
 * `x-api-key`.
 */
export async function resolveApiKey(): Promise<string | null> {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!hasSupabaseEnv) {
    console.warn('[resolveApiKey] supabase env vars missing', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
    return null;
  }

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

    if (!user) {
      console.warn('[resolveApiKey] no authenticated user on request');
      return null;
    }

    const admin = createAdminClient();
    if (!admin) {
      console.warn('[resolveApiKey] service role client unavailable', {
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
      return null;
    }

    return await ensureApiKeyForUser(admin, user.id);
  } catch (err) {
    console.error('[resolveApiKey] unexpected error', {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
