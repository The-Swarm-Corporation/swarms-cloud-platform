import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Prompt Generator — Production-Grade System Prompts',
  description:
    'Auto-generate production-grade system prompts for AI agents on Swarms Cloud. The specialized Prompt Architect agent turns a one-line brief into a drop-in deployable system prompt in seconds.',
  path: '/prompts',
  keywords: [
    'prompt generator',
    'system prompt generator',
    'AI prompt engineering',
    'prompt architect',
    'auto prompt',
    'production prompts',
    'prompt engineering tool',
    'free prompt generator',
    'AI system prompt examples',
    'agent system prompts',
    'prompt optimization',
    'prompt writing assistant',
    'LLM prompt builder',
    'best system prompts',
  ],
});

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Prompt Generator', '/prompts')} />
      {children}
    </>
  );
}
