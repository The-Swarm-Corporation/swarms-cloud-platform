import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Execution History - Agent & Swarm Run Logs',
  description:
    'Full API request log for every agent and swarm execution on Swarms Cloud - sortable, searchable, and exportable. Inspect inputs, outputs, tokens, and cost per run.',
  path: '/history',
  keywords: [
    'agent execution history',
    'API request logs',
    'swarm logs',
    'agent observability',
    'execution analytics',
    'AI audit trail',
    'agent run history',
    'LLM logging',
    'token usage tracking',
    'AI cost tracking',
  ],
});

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Execution History', '/history')} />
      {children}
    </>
  );
}
