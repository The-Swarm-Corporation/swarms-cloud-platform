'use client';

/**
 * localStorage keys that hold per-user data and must be wiped on sign-out so
 * the next account that signs in on the same browser does not inherit them.
 *
 * Intentionally excludes `ui-store` (theme, viewMode, sidebarOpen), which is
 * UI preference, not user data.
 */
const USER_SCOPED_KEYS = [
  'agent-store', // zustand: created agents + execution history
  'prompt-architect-history', // prompt generator history
  'recentApps', // recently visited apps
];

export function clearUserScopedStorage() {
  if (typeof window === 'undefined') return;
  try {
    for (const key of USER_SCOPED_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable (privacy mode, full disk); not fatal.
  }
}
