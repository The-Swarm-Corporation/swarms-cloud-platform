import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

// Workbench is a fully interactive client page (Zustand store, browser
// FileReader for image upload, clipboard for snippet copy). Opt out of
// static prerender to dodge the React Server Components bundler error:
// "Could not find the module ... in the React Client Manifest".
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Workbench — Build, Configure & Run AI Agents',
  description:
    'Build, configure, and run AI agents on Swarms Cloud. Tune model, system prompt, temperature, and tools, then execute against the production Swarms API in one click — an IDE for autonomous agents.',
  path: '/workbench',
  keywords: [
    'agent workbench',
    'AI agent builder',
    'configure agents',
    'prompt engineering',
    'agent IDE',
    'build AI agents online',
    'AI agent studio',
    'agent development environment',
    'test AI agents',
    'agent configuration tool',
    'LLM agent builder',
    'create custom AI agent',
  ],
});

export default function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Workbench', '/workbench')} />
      {children}
    </>
  );
}
