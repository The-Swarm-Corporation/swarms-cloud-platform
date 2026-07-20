import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'AI Agents, Build & Manage Autonomous Agents',
  description:
    'Manage every AI agent in your Swarms Cloud workspace. Browse, edit, and orchestrate autonomous agent configurations powered by the Swarms API, GPT, Claude, Gemini, and Llama agents in one dashboard.',
  path: '/agents',
  keywords: [
    'AI agent management',
    'agent configurations',
    'agent dashboard',
    'list agents',
    'Swarms agents',
    'manage AI agents',
    'autonomous agent dashboard',
    'AI agent workspace',
    'custom AI agents',
    'agent config editor',
    'LLM agent management',
    'agent catalog',
    'AI agent library',
    'edit AI agents',
  ],
});

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Agents', '/agents')} />
      {children}
    </>
  );
}
