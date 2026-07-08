import type { Metadata } from 'next';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  displayModelName,
  cleanModelName,
  splitModelId,
  providerLabel,
  modelHref,
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

export function generateStaticParams(): Params[] {
  return POPULAR_MODEL_IDS.map((id) => ({ model: id.split('/') }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const modelId = modelIdFromParams(await params);
  const displayName = displayModelName(modelId);
  const clean = cleanModelName(splitModelId(modelId).name);
  const { provider } = splitModelId(modelId);
  const providerName = provider ? providerLabel(provider) : null;

  // Enrich the description from the live catalog when available.
  let catalogDescription: string | null = null;
  try {
    const catalog = await getServerCatalog();
    const entry = catalog.find((m) => m.id === modelId);
    const meta =
      entry?.raw && typeof entry.raw === 'object'
        ? (entry.raw as Record<string, unknown>)
        : null;
    catalogDescription =
      (meta &&
        (typeof meta.description === 'string'
          ? meta.description
          : typeof meta.summary === 'string'
          ? meta.summary
          : null)) ||
      null;
  } catch {
    // metadata falls back to the generated description
  }

  const description =
    catalogDescription && catalogDescription.length <= 300
      ? catalogDescription
      : `Run ${modelId} through the Swarms API. Get an API key, copy Python, TypeScript, and cURL quickstart examples, and scale ${clean} from a single agent to a multi-agent swarm.`;

  return buildMetadata({
    title: `${displayName} API — Quickstart & Code Examples`,
    description,
    path: modelHref(modelId),
    ogImage: `/api/og/model?id=${encodeURIComponent(modelId)}`,
    keywords: [
      modelId,
      `${modelId} API`,
      `${modelId} api key`,
      `${modelId} example`,
      `${modelId} agents`,
      `run ${modelId}`,
      `${clean} API`,
      `${clean} agents`,
      `${clean} multi-agent`,
      `${clean} quickstart`,
      ...(providerName
        ? [`${providerName} models`, `${providerName} API`]
        : []),
    ],
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
  const path = modelHref(modelId);
  const faqs = buildModelFaqs(modelId);

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
      <ModelDetailClient modelId={modelId} />
    </>
  );
}
