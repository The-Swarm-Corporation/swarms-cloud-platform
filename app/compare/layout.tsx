import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Compare Agents, Run Models Side by Side',
  description:
    'Run the same task through 2 or more agents at once and compare their responses side by side. Test different models, prompts, and saved agent configurations from your Swarms Cloud workspace through the Agent Completions API.',
  path: '/compare',
  keywords: [
    'compare AI models',
    'compare LLM outputs',
    'model comparison tool',
    'side by side AI comparison',
    'compare agents',
    'compare GPT and Claude',
    'AI model benchmark',
    'test multiple models',
    'agent comparison',
    'LLM A/B testing',
    'multi-model comparison',
  ],
});

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Compare', '/compare')} />
      {children}
    </>
  );
}
