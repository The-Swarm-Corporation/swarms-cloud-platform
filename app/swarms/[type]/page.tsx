import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata, breadcrumbJsonLd, SITE } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  isKnownSwarmType,
  metaFor,
  displaySwarmName,
  swarmHref,
  swarmSeoTitle,
  swarmSeoDescription,
  swarmKeywords,
  buildSwarmFaqs,
  SWARM_TYPES,
} from '@/lib/swarms/catalog';
import { SwarmDetailClient } from './SwarmDetailClient';

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { type: string };

export function generateStaticParams(): Params[] {
  return (SWARM_TYPES as readonly string[]).map((typeId) => ({ type: typeId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const typeId = decodeURIComponent((await params).type);
  if (!isKnownSwarmType(typeId)) {
    return buildMetadata({
      title: 'Swarm Type Not Found',
      description: 'The requested swarm architecture could not be found.',
      path: '/swarms',
      index: false,
    });
  }

  return buildMetadata({
    title: swarmSeoTitle(typeId),
    description: swarmSeoDescription(typeId),
    path: swarmHref(typeId),
    keywords: swarmKeywords(typeId),
  });
}

export default async function SwarmDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const typeId = decodeURIComponent((await params).type);
  if (!isKnownSwarmType(typeId)) {
    notFound();
  }

  const meta = metaFor(typeId);
  const displayName = displaySwarmName(typeId);
  const path = swarmHref(typeId);
  const url = `${SITE.url}${path}`;
  const faqs = buildSwarmFaqs(typeId);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Get started with ${displayName} on Swarms Cloud`,
    description: `Run ${typeId} with the Swarms API: set your API key, list available swarm types, and send a request.`,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Get your Swarms API key',
        text: 'Create an API key at swarms.world/platform/api-keys.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Set it in your environment',
        text: 'Export SWARMS_API_KEY in your shell or add it to your .env file.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'List available swarm types',
        text: 'GET https://api.swarms.world/v1/swarms/available to confirm the type is supported.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: `Run a ${displayName} swarm`,
        text: `POST the SwarmSpec to the ${typeId === 'BatchedGridWorkflow' ? '/v1/batched-grid-workflow/completions' : '/v1/swarm/completions'} endpoint with swarm_type set to "${typeId}".`,
      },
    ],
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: displayName,
    alternateName: typeId,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Multi-Agent Orchestration',
    operatingSystem: 'Web',
    url,
    description: meta.description,
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    isAccessibleForFree: false,
    potentialAction: {
      '@type': 'UseAction',
      target: `${SITE.url}/playground?swarmType=${encodeURIComponent(typeId)}`,
      name: `Try ${displayName} in the Swarms Playground`,
    },
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Swarm Types', path: '/swarms' },
          { name: displayName, path },
        ])}
      />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={howToJsonLd} />
      <JsonLd data={appJsonLd} />
      <SwarmDetailClient typeId={typeId} />
    </>
  );
}
