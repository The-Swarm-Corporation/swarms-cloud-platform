import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'AI Model Catalog — GPT, Claude, Gemini, Llama & More',
  description:
    'Browse every AI model available on Swarms Cloud — GPT-4o, Claude Opus and Sonnet, Gemini, Llama, DeepSeek, Qwen, and more — ready to plug into agent and swarm configurations through one OpenAI-compatible API.',
  path: '/models',
  keywords: [
    'AI model catalog',
    'LLM catalog',
    'GPT-4o',
    'Claude Sonnet',
    'Claude Opus',
    'Gemini',
    'Llama',
    'DeepSeek',
    'Qwen',
    'Mistral',
    'model selection',
    'OpenAI compatible',
    'LLM comparison',
    'best LLM for agents',
    'AI model list',
    'foundation models',
    'frontier models',
    'open source LLM',
    'multi-model API',
    'one API for all models',
    'LLM provider catalog',
  ],
});

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Models', '/models')} />
      {children}
    </>
  );
}
