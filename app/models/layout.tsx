import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'AI Model Catalog | GPT, Claude, Gemini, Llama & More',
  description:
    'Browse every AI model available on Swarms Cloud, including GPT-4o, Claude Opus and Sonnet, Gemini, Llama, DeepSeek, Qwen, and more, ready to plug into agent and swarm configurations through the Agent Completions API.',
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
    'Agent Completions API',
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
  // Breadcrumb JSON-LD is emitted per page: the list page emits the
  // two-level trail and each model detail page emits its own three-level
  // trail, so the layout must not add one of its own.
  return <>{children}</>;
}
