'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Settings as SettingsIcon,
  BookOpen,
  LogOut,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';
import { clearUserScopedStorage } from '@/lib/auth/client-storage';

export function AccountMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    startSignOut(async () => {
      clearUserScopedStorage();
      await signOutAction();
    });
  };

  const isOnSettings = pathname === '/settings';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title="Account"
        className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
          open || isOnSettings
            ? 'bg-muted text-foreground border-border-strong'
            : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
        }`}
      >
        <User className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-md border border-border bg-card shadow-md overflow-hidden"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 h-9 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Settings</span>
          </Link>

          <a
            href="https://docs.swarms.ai"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 h-9 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1">Docs</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <div className="border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-describedby="account-menu-signout-hint"
            className="w-full flex items-center gap-2.5 px-3 h-9 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
          <span id="account-menu-signout-hint" className="sr-only">
            Ends your current session on this device and returns you to the
            login page.
          </span>
        </div>
      )}
    </div>
  );
}
