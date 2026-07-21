import type { Metadata } from 'next';

/**
 * Single source of truth for site-wide SEO. Override `NEXT_PUBLIC_SITE_URL`
 * to point metadata at the production domain (e.g. https://cloud.swarms.ai).
 */
export const SITE = {
  name: 'Swarms Cloud',
  shortName: 'Swarms',
  url: (() => {
    const raw =
      process.env.NEXT_PUBLIC_SITE_URL &&
      process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_SITE_URL
        : process.env.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'https://swarms.ai';
    return raw.replace(/\/+$/, '');
  })(),
  tagline: 'Build, deploy, and scale multi-agent systems for any application.',
  description:
    'Swarms Cloud is the enterprise-grade platform for building, deploying, and scaling multi-agent AI systems. Orchestrate single agents, reasoning agents, and 17+ multi-agent architectures, including Hierarchical, Sequential, Concurrent, Mixture-of-Agents, Council, Debate-with-Judge, and more, through a production-ready, OpenAI-compatible API powered by a Rust agent runtime.',
  shortDescription:
    'The cloud for building, deploying, and scaling multi-agent systems.',
  keywords: [
    // Brand
    'Swarms',
    'Swarms Cloud',
    'Swarms API',
    'Swarms AI',
    'swarms framework',
    'swarms python',
    'Kye Gomez',
    // Category
    'multi-agent systems',
    'multi-agent orchestration',
    'multi-agent AI',
    'multi-agent framework',
    'multi-agent platform',
    'multi-agent collaboration',
    'AI agents',
    'AI agent platform',
    'AI agent orchestration platform',
    'AI agent infrastructure',
    'AI agent framework',
    'AI agent API',
    'agent orchestration',
    'agentic AI',
    'agentic workflows',
    'agentic infrastructure',
    'autonomous agents',
    'autonomous AI agents',
    'AI infrastructure',
    'LLM orchestration',
    'LLM agents',
    'LLM API',
    'swarm intelligence',
    'agent swarm',
    'AI swarm',
    'agent runtime',
    'Rust agent runtime',
    'agent framework',
    'agent platform',
    'agents as a service',
    // Build / deploy / scale
    'build AI agents',
    'deploy AI agents',
    'scale AI agents',
    'create AI agents',
    'production AI agents',
    'enterprise AI agents',
    'AI agent deployment',
    'AI agent hosting',
    'enterprise AI',
    'production AI',
    'AI automation',
    'workflow automation',
    'AI workflow automation',
    'business process automation',
    // Architectures
    'hierarchical swarm',
    'sequential workflow',
    'concurrent workflow',
    'mixture of agents',
    'council as a judge',
    'debate with judge',
    'multi-agent router',
    'auto swarm builder',
    'majority voting agents',
    'group chat agents',
    'graph workflow',
    'agent rearrange',
    'planner worker swarm',
    // Capabilities
    'reasoning agents',
    'batch agents',
    'deep research API',
    'AI research agents',
    'structured outputs',
    'function calling',
    'tool calling',
    'MCP',
    'Model Context Protocol',
    'vision agents',
    'web search agents',
    'RAG agents',
    'retrieval augmented generation',
    // Models & compatibility
    'OpenAI compatible API',
    'GPT agents',
    'GPT-4o agents',
    'Claude agents',
    'Gemini agents',
    'Llama agents',
    'DeepSeek agents',
    'Qwen agents',
    // Use cases
    'AI copilots',
    'AI assistants',
    'no-code agent builder',
    'visual workflow builder',
    'drag and drop AI workflow',
    'AI research assistant',
    'data analysis agents',
    'customer support agents',
    'financial analysis AI',
    'code generation agents',
    // Comparisons / adjacent searches
    'LangChain alternative',
    'LangGraph alternative',
    'AutoGen alternative',
    'CrewAI alternative',
    'best multi-agent framework',
    'best AI agent platform',
    // Developer
    'Python AI agents',
    'TypeScript AI agents',
    'agent SDK',
    'AI developer tools',
    'AI API platform',
  ],
  twitter: '@swarms_corp',
  author: 'Swarms',
  themeColor: '#EE0712',
  ogImage: '/og-image.png',
  locale: 'en_US',
} as const;

const TITLE_SEPARATOR = ' | ';

export type SeoInput = {
  /** Page title (no brand suffix; the template adds it). */
  title: string;
  /** Page description. Keep under ~160 characters for best SERP rendering. */
  description: string;
  /** Path relative to SITE.url (e.g. "/agents"). */
  path?: string;
  /** Optional additional keywords merged with site defaults. */
  keywords?: readonly string[];
  /** Whether the page should be indexed. Defaults to true. */
  index?: boolean;
  /** Override the OG image. */
  ogImage?: string;
};

/**
 * Build a Next.js `Metadata` object for a page using the shared site config.
 * Handles canonical URL, OpenGraph, Twitter, robots, and keyword merging.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const url = input.path
    ? `${SITE.url}${input.path.startsWith('/') ? '' : '/'}${input.path}`
    : SITE.url;
  const ogImage = input.ogImage ?? SITE.ogImage;
  const absoluteOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${SITE.url}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  const fullTitle = `${input.title}${TITLE_SEPARATOR}${SITE.name}`;

  const keywords = Array.from(
    new Set([...(input.keywords ?? []), ...SITE.keywords])
  );

  const index = input.index ?? true;

  return {
    title: input.title,
    description: input.description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title: fullTitle,
      description: input.description,
      locale: SITE.locale,
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      creator: SITE.twitter,
      title: fullTitle,
      description: input.description,
      images: [absoluteOgImage],
    },
  };
}

/**
 * JSON-LD Organization markup for the root layout.
 */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  logo: `${SITE.url}/swarms-logo.svg`,
  description: SITE.description,
  sameAs: [
    'https://swarms.ai',
    'https://docs.swarms.ai',
    'https://docs.swarms.world',
    'https://github.com/kyegomez/swarms',
    'https://twitter.com/swarms_corp',
  ],
};

/**
 * JSON-LD BreadcrumbList markup for a page. Pass the trail from the home
 * page down to the current page; rendered via <JsonLd> in the page's layout.
 */
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/**
 * JSON-LD BreadcrumbList for the common Home → <page> case.
 */
export function pageBreadcrumbJsonLd(name: string, path: string) {
  return breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name, path }]);
}

/**
 * JSON-LD SoftwareApplication markup positioning Swarms Cloud as the product.
 */
export const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE.name,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: SITE.url,
  description: SITE.description,
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '100',
    offerCount: 4,
  },
  featureList: [
    'Single agent execution',
    '17+ multi-agent swarm architectures',
    'Hierarchical, Sequential, Concurrent, and Council workflows',
    'Auto Swarm Builder',
    'Reasoning agents',
    'Batch completions and grid workflows',
    'OpenAI-compatible API',
    'Real-time rate limit and usage analytics',
    'Token-based pricing calculator',
    'Model catalog across providers',
  ],
  publisher: {
    '@type': 'Organization',
    name: SITE.shortName,
    url: 'https://swarms.ai',
  },
};
