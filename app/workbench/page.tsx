'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

// Render the Workbench tree client-side only. Skips SSR entirely so the
// Zustand store, browser FileReader (image uploader), and clipboard
// (snippet preview) never run against an undefined `window`. This also
// dodges the Next 15 React Server Components bundler error:
// "Could not find the module ... in the React Client Manifest".
const WorkbenchClient = dynamic(() => import('./WorkbenchClient'), {
  ssr: false,
  loading: () => <WorkbenchFallback />,
});

export default function WorkbenchPage() {
  return <WorkbenchClient />;
}

function WorkbenchFallback() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Build</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Workbench
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Create, configure, and execute agents across grid, table, heatmap,
              and kanban views.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading Workbench…</p>
          </div>
        </div>
      </main>
    </div>
  );
}
