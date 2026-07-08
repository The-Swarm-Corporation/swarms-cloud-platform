import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import {
  cleanModelName,
  splitModelId,
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
  const { provider, name } = modelId
    ? splitModelId(modelId)
    : { provider: null as string | null, name: '' };
  const clean = modelId ? cleanModelName(name) : 'Model Catalog';
  const visual = providerVisual(provider);
  const accent = visual?.color ?? '#EE0712';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#09090b',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent rail in the provider's brand color */}
        <div style={{ width: 14, height: '100%', backgroundColor: accent }} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 64,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  backgroundColor: '#EE0712',
                }}
              />
              <div style={{ color: '#a1a1aa', fontSize: 30 }}>
                Swarms Cloud
              </div>
            </div>
            {visual && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 22px',
                  borderRadius: 9999,
                  border: `2px solid ${accent}55`,
                  backgroundColor: `${accent}1a`,
                }}
              >
                <div
                  style={{
                    color: accent,
                    fontSize: 26,
                    fontWeight: 700,
                  }}
                >
                  {visual.label}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                color: '#fafafa',
                fontSize:
                  clean.length > 28 ? 54 : clean.length > 18 ? 66 : 80,
                fontWeight: 700,
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
                  padding: '10px 18px',
                  borderRadius: 12,
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
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
            }}
          >
            <div style={{ color: '#a1a1aa', fontSize: 26 }}>
              API quickstart · Single agents · Multi-agent swarms
            </div>
            <div style={{ color: '#52525b', fontSize: 26 }}>
              swarms.ai/models
            </div>
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
