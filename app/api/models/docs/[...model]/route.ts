import { NextResponse } from 'next/server';
import { buildModelDocs } from '@/lib/models/model-docs';
import { entryModelName } from '@/lib/models/catalog';
import { getServerCatalog } from '@/lib/models/server-catalog';

// Matches the ISR window on the model detail page and /api/models cache.
export const revalidate = 86400;

type Params = { model: string[] };

function modelIdFromParams(params: Params): string {
  const segments = Array.isArray(params.model) ? params.model : [params.model];
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

/**
 * Plain-text Markdown quick-start docs for a model, at
 * /models/<id>.md (rewritten here by middleware). Lets agents and crawlers
 * fetch the same content as the "Copy Docs" button without a browser.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const modelId = modelIdFromParams(await params);

  const catalog = await getServerCatalog();
  const entry = catalog.find((m) => m.id === modelId) ?? null;
  const modelName = entry ? entryModelName(entry) : modelId;
  const meta =
    entry?.raw && typeof entry.raw === 'object'
      ? (entry.raw as Record<string, unknown>)
      : null;
  const description =
    (meta &&
      (typeof meta.description === 'string'
        ? meta.description
        : typeof meta.summary === 'string'
        ? meta.summary
        : null)) ||
    null;

  const docs = buildModelDocs({ modelId, modelName, description });

  return new NextResponse(docs, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
