import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Observability, Monitor AI Agents in Production',
  description:
    'Monitor API request performance, latency, and error rates across every agent and swarm execution on Swarms Cloud. Live dashboards for request volume, success rate, and rate limits.',
  path: '/observability',
  keywords: [
    'observability',
    'api monitoring',
    'latency',
    'error rate',
    'cache hit rate',
    'rate limits',
    'agent telemetry',
    'AI observability',
    'LLM observability',
    'agent monitoring',
    'AI ops',
    'LLMOps',
    'production AI monitoring',
    'AI performance dashboard',
  ],
});

export default function ObservabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Observability', '/observability')} />
      {children}
    </>
  );
}
