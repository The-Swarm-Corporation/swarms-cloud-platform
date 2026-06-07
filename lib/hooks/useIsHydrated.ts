'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `false` on the server and during the first client render, then
 * `true` after mount. Use this to gate any render that reads from a
 * zustand-persisted store (or anything else backed by localStorage) so that
 * the server's empty snapshot and the client's hydrated snapshot agree on
 * the first paint — which prevents React hydration mismatches (error #418).
 *
 * Pattern:
 *   const fromStore = useAgentStore((s) => s.agents);
 *   const hydrated = useIsHydrated();
 *   const agents = hydrated ? fromStore : [];
 */
export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
