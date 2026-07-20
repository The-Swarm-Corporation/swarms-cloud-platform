import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing - Transparent Token-Based API Pricing Calculator',
  description:
    'Estimate Swarms API costs by tokens, agents, and tools. Unified $6.50/M input and $18.50/M output token rate across all models, plus agent cost, image, MCP, Exa search, and web-scraper add-ons, night-time discount, and Frenzy Mode.',
  path: '/pricing',
  keywords: [
    'Swarms API pricing',
    'token pricing calculator',
    'AI cost estimator',
    'multi-agent pricing',
    'LLM cost calculator',
    'API cost calculator',
    'night-time discount',
    'batch pricing',
    'AI agent pricing',
    'AI API cost',
    'token cost calculator',
    'LLM pricing comparison',
    'pay per token',
    'usage-based AI pricing',
    'cost per million tokens',
    'AI budget planning',
  ],
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Pricing', '/pricing')} />
      {children}
    </>
  );
}
