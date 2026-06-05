'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store/ui-store';
import { useAgentStore } from '@/lib/store/agent-store';
import { CreditBalance } from '@/components/dashboard/CreditBalance';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NavSearch } from './NavSearch';
import {
  PanelRightOpen,
  LayoutGrid,
  Hammer,
  Users,
  History,
  Settings,
  Cpu,
  Calculator,
  Network,
  Sparkles,
  Wand2,
  AppWindow,
  User,
  Package,
} from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Navbar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const agents = useAgentStore((state) => state.agents);

  const totalExecutions = agents.reduce(
    (sum, agent) => sum + agent.execution_history.length,
    0
  );

  const tabs: TabItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/apps', label: 'Apps', icon: AppWindow },
    { href: '/workbench', label: 'Workbench', icon: Hammer },
    { href: '/agents', label: 'Agents', icon: Users, badge: agents.length },
    { href: '/history', label: 'History', icon: History, badge: totalExecutions },
    { href: '/models', label: 'Models', icon: Cpu },
    { href: '/swarms', label: 'Swarms', icon: Network },
    { href: '/sdks', label: 'SDKs', icon: Package },
    { href: '/playground', label: 'Playground', icon: Sparkles },
    { href: '/prompts', label: 'Prompts', icon: Wand2 },
    { href: '/pricing', label: 'Pricing', icon: Calculator },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 w-full bg-background">
      {/* Row 1 — utility bar (logo, workspace, theme, outputs) */}
      <div
        className="bg-subtle border-b border-border"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="h-11 w-full min-w-0 px-3 sm:px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Image
                src="/swarms-logo.svg"
                alt="Swarms"
                width={24}
                height={24}
                priority
                className="w-6 h-6 flex-shrink-0"
              />
              <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                Swarms Cloud
              </span>
            </Link>
            <div className="hidden sm:flex items-center flex-1 max-w-md min-w-0">
              <NavSearch />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
            <CreditBalance />
            <ThemeSwitcher compact />
            <Link
              href="/settings"
              aria-label="Account settings"
              title="Settings"
              className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border transition-colors ${
                pathname === '/settings'
                  ? 'bg-muted text-foreground border-border-strong'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2 — tab strip (AWS-style underline-active) */}
      <nav
        className="bg-background border-b border-border"
        style={{
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        }}
        aria-label="Primary"
      >
        <div className="px-2 sm:px-3 overflow-x-auto sidebar-scroll">
          <ul className="flex items-stretch gap-0.5 min-w-max">
            {tabs.map((tab) => {
              const isActive =
                tab.href === '/' ? pathname === '/' : pathname === tab.href;
              const Icon = tab.icon;
              return (
                <li key={tab.href} className="flex">
                  <Link
                    href={tab.href}
                    className={`relative inline-flex items-center gap-1.5 px-3 h-10 text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`ml-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-sm text-[10px] tabular-nums font-medium border ${
                          isActive
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 bg-accent rounded-t-sm" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
