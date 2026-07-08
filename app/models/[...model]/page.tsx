import type { Metadata } from 'next';
import { buildMetadata, breadcrumbJsonLd, SITE } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  displayModelName,
  cleanModelName,
  splitModelId,
  providerLabel,
  modelHref,
  modelKeywords,
  modelSeoTitle,
  modelSeoDescription,
  buildModelFaqs,
  POPULAR_MODEL_IDS,
} from '@/lib/models/catalog';
import { getServerCatalog } from '@/lib/models/server-catalog';
import { ModelDetailClient } from './ModelDetailClient';

// Popular models are pre-rendered at build; everything else is rendered on
// demand and cached (ISR).
export const revalidate = 86400;
export const dynamicParams = true;

type Params = { model: string[] };

function modelIdFromParams(params: Params): string {
  const segments = Array.isArray(params.model)
    ? params.model
    : [params.model];
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

function ogImagePath(modelId: string): string {
  return `/api/og/model?id=${encodeURIComponent(modelId)}`;
}

async function catalogDescriptionFor(modelId: string): Promise<string | null> {
  try {
    const catalog = await getServerCatalog();
    const entry = catalog.find((m) => m.id === modelId);
    const meta =
      entry?.raw && typeof entry.raw === 'object'
        ? (entry.raw as Record<string, unknown>)
        : null;
    return (
      (meta &&
        (typeof meta.description === 'string'
          ? meta.description
          : typeof meta.summary === 'string'
          ? meta.summary
          : null)) ||
      null
    );
  } catch {
    return null;
  }
}

export function generateStaticParams(): Params[] {
  return POPULAR_MODEL_IDS.map((id) => ({ model: id.split('/') }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const modelId = modelIdFromParams(await params);
  const catalogDescription = await catalogDescriptionFor(modelId);

  return buildMetadata({
    title: modelSeoTitle(modelId),
    description: modelSeoDescription(modelId, catalogDescription),
    path: modelHref(modelId),
    ogImage: ogImagePath(modelId),
    keywords: modelKeywords(modelId),
  });
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const modelId = modelIdFromParams(await params);
  const displayName = displayModelName(modelId);
  const clean = cleanModelName(splitModelId(modelId).name);
  const { provider } = splitModelId(modelId);
  const path = modelHref(modelId);
  const url = `${SITE.url}${path}`;
  const faqs = buildModelFaqs(modelId);
  const catalogDescription = await catalogDescriptionFor(modelId);
  const description = modelSeoDescription(modelId, catalogDescription);

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
    name: `Get started with ${clean} on Swarms Cloud`,
    description: `Run ${modelId} with the Swarms API, from a single agent to a multi-agent swarm.`,
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
        name: 'Run a single agent',
        text: `POST to https://api.swarms.world/v1/agent/completions with agent_config.model_name set to "${modelId}".`,
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Scale to a multi-agent swarm',
        text: `POST to /v1/swarm/completions with multiple agents running "${modelId}".`,
      },
    ],
  };

  // The model itself as a product node, linked to Swarms Cloud as provider.
  const modelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: displayName,
    alternateName: modelId,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Large Language Model',
    operatingSystem: 'Web',
    url,
    image: `${SITE.url}${ogImagePath(modelId)}`,
    description,
    ...(provider
      ? {
          creator: {
            '@type': 'Organization',
            name: providerLabel(provider),
          },
        }
      : {}),
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    isAccessibleForFree: false,
    potentialAction: {
      '@type': 'UseAction',
      target: `${SITE.url}/playground?model=${encodeURIComponent(modelId)}`,
      name: `Try ${clean} in the Swarms Playground`,
    },
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Models', path: '/models' },
          { name: displayName, path },
        ])}
      />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={howToJsonLd} />
      <JsonLd data={modelJsonLd} />
      <ModelDetailClient modelId={modelId} />
    </>
  );
}
