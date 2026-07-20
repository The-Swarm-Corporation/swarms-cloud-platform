import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

// The playground reads useSearchParams() — opt out of prerender so SEO
// metadata still applies without forcing a Suspense rewrite of the page.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Playground: Run Multi-Agent Swarms in Your Browser',
  description:
    'Compose, configure, and run multi-agent swarms in the browser. Experiment with 17+ collaboration patterns, models, and tools on Swarms Cloud. No setup, no install, no code required to start.',
  path: '/playground',
  keywords: [
    'agent playground',
    'swarm playground',
    'multi-agent demo',
    'agent prototype',
    'AI sandbox',
    'try Swarms',
    'LLM playground',
    'AI agent playground online',
    'test AI agents',
    'multi-agent simulator',
    'no-code AI agents',
    'run agents in browser',
    'free AI playground',
    'agent experimentation',
  ],
});

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Playground', '/playground')} />
      {children}
    </>
  );
}
