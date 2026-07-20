'use client';

import { createClient } from '@/lib/supabase/client';

// Minimal Phantom wallet surface we depend on. Defined here so the rest of
// the codebase doesn't have to widen `Window` globally.
interface PhantomSolana {
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string } | null;
  connect: (
    options?: { onlyIfTrusted?: boolean },
  ) => Promise<{ publicKey: { toBase58: () => string } }>;
  signMessage?: (message: Uint8Array, encoding?: string) => Promise<unknown>;
}

declare global {
  interface Window {
    solana?: PhantomSolana;
  }
}

export function hasPhantomWallet(): boolean {
  return (
    typeof window !== 'undefined' && Boolean(window.solana?.isPhantom)
  );
}

export const PHANTOM_INSTALL_URL = 'https://phantom.app/';

const TOS_STATEMENT =
  'I accept the Swarms Terms of Service: https://swarms.ai/terms';

/**
 * Sign in with a Solana wallet (Phantom). Walks the user through the
 * "connect → sign EIP-4361 message" flow, then hands off to Supabase's
 * Web3 auth provider which exchanges the signature for a session.
 *
 * Throws a string-typed Error on any failure. Callers should map known
 * messages to user-facing copy themselves.
 */
export async function signInWithPhantom(): Promise<void> {
  if (typeof window === 'undefined' || !window.solana?.isPhantom) {
    throw new Error('Phantom wallet not detected. Install it to continue.');
  }

  const wallet = window.solana;

  // Prompt connect if not already connected. Phantom returns an error code 4001
  // if the user rejects the connection.
  try {
    await wallet.connect({ onlyIfTrusted: false });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 4001) {
      throw new Error('Connection request was rejected.');
    }
    // Already connected returns code -32002 or "already connected" - that's
    // fine, fall through and let signInWithWeb3 use the existing session.
    const message = (err as Error).message ?? '';
    if (
      code !== -32002 &&
      !message.toLowerCase().includes('already connected')
    ) {
      throw err;
    }
  }

  if (typeof wallet.signMessage !== 'function') {
    throw new Error(
      'Your Phantom wallet build does not support message signing. Update the extension and try again.',
    );
  }

  if (!wallet.publicKey || typeof wallet.publicKey.toBase58 !== 'function') {
    throw new Error('Could not read your wallet address. Please reconnect.');
  }

  const supabase = createClient();

  // `signInWithWeb3` lives on the auth client in @supabase/supabase-js v2.x.
  // Older builds may not have it; guard so callers see a clean message rather
  // than a "is not a function" crash.
  const authClient = supabase.auth as unknown as {
    signInWithWeb3?: (params: {
      chain: 'solana';
      statement: string;
      wallet: unknown;
    }) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  if (typeof authClient.signInWithWeb3 !== 'function') {
    throw new Error(
      'Web3 authentication is not enabled for this site. Please contact support.',
    );
  }

  const { error } = await authClient.signInWithWeb3({
    chain: 'solana',
    statement: TOS_STATEMENT,
    wallet,
  });

  if (error) {
    throw new Error(error.message || 'Wallet sign-in failed.');
  }
}
