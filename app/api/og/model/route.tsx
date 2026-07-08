import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import {
  cleanModelName,
  splitModelId,
  entryProvider,
  providerVisual,
} from '@/lib/models/catalog';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/**
 * Open Graph image for model detail pages: /api/og/model?id=<model-id>.
 * This is what renders when a model link is shared on Slack, Twitter/X,
 * Discord, LinkedIn, iMessage, etc. Lives outside /models/[...model]
 * because a file convention there would create a segment after the
 * catch-all, which the router rejects.
 */
export async function GET(request: NextRequest) {
  const modelId = request.nextUrl.searchParams.get('id')?.slice(0, 100) || '';
  const { name } = modelId ? splitModelId(modelId) : { name: '' };
  const clean = modelId ? cleanModelName(name) : 'Model Catalog';
  // entryProvider also infers providers from bare names (claude-* →
  // anthropic), so un-prefixed ids still get their brand pill.
  const provider = modelId
    ? entryProvider({ id: modelId, raw: null, searchText: '' })
    : null;
  const visual = providerVisual(provider);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #000000 0%, #161618 100%)',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              color: '#f5f5f7',
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            Swarms Cloud
          </div>
          {visual && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 24px',
                borderRadius: 9999,
                border: '1px solid #3a3a3c',
                backgroundColor: '#1c1c1e',
                color: '#d1d1d6',
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {visual.label}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              color: '#f5f5f7',
              fontSize: clean.length > 28 ? 54 : clean.length > 18 ? 66 : 80,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
            }}
          >
            {clean}
          </div>
          {modelId && (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '10px 20px',
                borderRadius: 12,
                backgroundColor: '#1c1c1e',
                border: '1px solid #2c2c2e',
                color: '#98989d',
                fontSize: 28,
                fontFamily: 'monospace',
              }}
            >
              {modelId}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #2c2c2e',
            paddingTop: 32,
          }}
        >
          <div style={{ color: '#98989d', fontSize: 26 }}>
            API quickstart · Single agents · Multi-agent swarms
          </div>
          <div style={{ color: '#636366', fontSize: 26 }}>
            cloud.swarms.world/models
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
