import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Apps — Every Tool on the Multi-Agent AI Platform',
  description:
    'A directory of every page, tool, and product in Swarms Cloud, grouped by purpose with full-text search — agent workbench, swarm playground, workflow builder, prompt generator, model catalog, and more.',
  path: '/apps',
  keywords: [
    'apps directory',
    'launcher',
    'all pages',
    'tools',
    'products',
    'workspace index',
    'AI tools directory',
    'AI agent tools',
    'multi-agent tools',
    'developer tools for AI agents',
    'AI platform apps',
    'agent tooling',
    'AI workspace',
  ],
});

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Apps', '/apps')} />
      {children}
    </>
  );
}
