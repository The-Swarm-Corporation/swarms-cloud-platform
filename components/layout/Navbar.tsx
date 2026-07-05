'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store/ui-store';
import { useAgentStore } from '@/lib/store/agent-store';
import { useRecentApps } from '@/lib/hooks/useRecentApps';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { CreditBalance } from '@/components/dashboard/CreditBalance';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NavSearch } from './NavSearch';
import { AccountMenu } from './AccountMenu';
import {
  PanelRightOpen,
  LayoutGrid,
  Hammer,
  Users,
  History,
  Activity,
  Settings,
  Cpu,
  Gauge,
  BarChart3,
  Calculator,
  Network,
  Sparkles,
  Wand2,
  AppWindow,
  Package,
  KeyRound,
  BookOpen,
  Workflow,
  ChevronLeft,
  ChevronRight,
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
  const agentsFromStore = useAgentStore((state) => state.agents);
  const hydrated = useIsHydrated();
  // Empty on the server and on the very first client render to prevent
  // hydration mismatches; populated by localStorage after mount.
  const agents = hydrated ? agentsFromStore : [];
  const { recordVisit } = useRecentApps();

  React.useEffect(() => {
    if (pathname) recordVisit(pathname);
  }, [pathname, recordVisit]);

  const totalExecutions = agents.reduce(
    (sum, agent) => sum + agent.execution_history.length,
    0
  );

  // Horizontal scroll controls for the tab strip.
  const tabStripRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollAffordance = React.useCallback(() => {
    const el = tabStripRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  React.useEffect(() => {
    const el = tabStripRef.current;
    if (!el) return;
    updateScrollAffordance();
    el.addEventListener('scroll', updateScrollAffordance, { passive: true });
    const observer = new ResizeObserver(updateScrollAffordance);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollAffordance);
      observer.disconnect();
    };
  }, [updateScrollAffordance, hydrated]);

  const scrollTabs = (direction: 1 | -1) => {
    const el = tabStripRef.current;
    if (!el) return;
    const amount = Math.max(160, el.clientWidth * 0.7);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const tabs: TabItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/apps', label: 'Apps', icon: AppWindow },
    { href: '/workbench', label: 'Workbench', icon: Hammer },
    { href: '/agents', label: 'Agents', icon: Users, badge: agents.length },
    { href: '/history', label: 'History', icon: History, badge: totalExecutions },
    { href: '/observability', label: 'Observability', icon: Activity },
    { href: '/rate-limits', label: 'Rate Limits', icon: Gauge },
    { href: '/token-usage', label: 'Usage', icon: BarChart3 },
    { href: '/models', label: 'Models', icon: Cpu },
    { href: '/swarms', label: 'Swarms', icon: Network },
    { href: '/sdks', label: 'SDKs', icon: Package },
    { href: '/playground', label: 'Playground', icon: Sparkles },
    { href: '/workflow-builder', label: 'Workflow Builder', icon: Workflow },
    { href: '/prompts', label: 'Prompts', icon: Wand2 },
    { href: '/pricing', label: 'Pricing', icon: Calculator },
    { href: '/api-keys', label: 'API Keys', icon: KeyRound },
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
            <a
              href="https://docs.swarms.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2 rounded-sm border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </a>
            <a
              href="https://status.swarms.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2 rounded-sm border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Status</span>
            </a>
            <CreditBalance />
            <ThemeSwitcher compact />
            <AccountMenu />
          </div>
        </div>
      </div>

      {/* Row 2 — tab strip (AWS-style underline-active) */}
      <nav
        className="relative bg-background border-b border-border"
        style={{
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        }}
        aria-label="Primary"
      >
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll tabs left"
            onClick={() => scrollTabs(-1)}
            className="absolute left-0 inset-y-0 z-10 flex items-center justify-start pl-1 pr-6 w-14 bg-gradient-to-r from-background via-background to-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll tabs right"
            onClick={() => scrollTabs(1)}
            className="absolute right-0 inset-y-0 z-10 flex items-center justify-end pr-1 pl-6 w-14 bg-gradient-to-l from-background via-background to-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <div ref={tabStripRef} className="px-2 sm:px-3 overflow-x-auto nav-scroll">
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
