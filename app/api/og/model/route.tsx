import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import {
  displayModelName,
  splitModelId,
  providerLabel,
} from '@/lib/models/catalog';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/**
 * Open Graph image for model detail pages: /api/og/model?id=<model-id>.
 * Lives outside /models/[...model] because a file convention there would
 * create a segment after the catch-all, which the router rejects.
 */
export async function GET(request: NextRequest) {
  const modelId = request.nextUrl.searchParams.get('id')?.slice(0, 100) || '';
  const displayName = modelId ? displayModelName(modelId) : 'Model Catalog';
  const { provider } = modelId
    ? splitModelId(modelId)
    : { provider: null as string | null };
  const providerName = provider ? providerLabel(provider) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              backgroundColor: '#EE0712',
            }}
          />
          <div style={{ color: '#a1a1aa', fontSize: 32 }}>Swarms Cloud</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {providerName && (
            <div
              style={{
                color: '#a1a1aa',
                fontSize: 30,
                textTransform: 'uppercase',
                letterSpacing: 4,
              }}
            >
              {providerName}
            </div>
          )}
          <div
            style={{
              color: '#fafafa',
              fontSize: displayName.length > 32 ? 56 : 76,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {displayName}
          </div>
          {modelId && (
            <div
              style={{
                color: '#71717a',
                fontSize: 30,
                fontFamily: 'monospace',
              }}
            >
              {modelId}
            </div>
          )}
        </div>

        <div style={{ color: '#a1a1aa', fontSize: 28 }}>
          API quickstart · Single agents · Multi-agent swarms
        </div>
      </div>
    ),
    SIZE
  );
}
