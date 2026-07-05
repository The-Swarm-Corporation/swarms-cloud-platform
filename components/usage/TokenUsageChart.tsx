'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface ChartSeries {
  key: string;
  label: string;
  color: string; // CSS color, may be var(--…)
}

export interface ChartBucket {
  label: string; // full label, used in tooltip and table
  tick: string; // short axis label
  values: number[]; // one entry per series
}

interface TokenUsageChartProps {
  buckets: ChartBucket[];
  series: ChartSeries[];
  formatValue: (value: number) => string;
}

const HEIGHT = 320;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 56 };
const SEGMENT_GAP = 2;
const MAX_BAR_WIDTH = 24;

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const mantissa = value / base;
  const nice = mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 2.5 ? 2.5 : mantissa <= 5 ? 5 : 10;
  return nice * base;
}

// Rounded top corners, square baseline.
function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

export function TokenUsageChart({ buckets, series, formatValue }: TokenUsageChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<{ bucket: number; px: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const maxTotal = Math.max(
    0,
    ...buckets.map((b) => b.values.reduce((sum, v) => sum + v, 0)),
  );
  const yMax = niceCeil(maxTotal);
  const yScale = (v: number) => plotH - (v / yMax) * plotH;

  const n = buckets.length;
  const slotW = n > 0 ? plotW / n : 0;
  const barW = Math.max(2, Math.min(MAX_BAR_WIDTH, slotW * 0.6));
  const tickEvery = Math.max(1, Math.ceil(n / 8));

  const gridValues = [0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const hoveredBucket = hover ? buckets[hover.bucket] : null;
  const tooltipLeft =
    hover && width > 0
      ? Math.min(Math.max(hover.px, 90), width - 110)
      : 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={HEIGHT} role="img" aria-label="Token usage chart">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Gridlines + y labels */}
          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={0}
                x2={plotW}
                y1={yScale(v)}
                y2={yScale(v)}
                style={{ stroke: 'rgb(var(--border))' }}
                strokeWidth={1}
              />
              <text
                x={-8}
                y={yScale(v)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground tabular-nums"
                style={{ fontSize: 11 }}
              >
                {formatValue(v)}
              </text>
            </g>
          ))}
          {/* Baseline */}
          <line
            x1={0}
            x2={plotW}
            y1={plotH}
            y2={plotH}
            style={{ stroke: 'rgb(var(--border))' }}
            strokeWidth={1}
          />
          <text
            x={-8}
            y={plotH}
            dy="0.32em"
            textAnchor="end"
            className="fill-muted-foreground tabular-nums"
            style={{ fontSize: 11 }}
          >
            0
          </text>

          {/* Hover highlight */}
          {hover && (
            <rect
              x={hover.bucket * slotW}
              y={0}
              width={slotW}
              height={plotH}
              style={{ fill: 'rgb(var(--muted))' }}
              opacity={0.5}
            />
          )}

          {/* Bars */}
          {buckets.map((bucket, bi) => {
            const x = bi * slotW + (slotW - barW) / 2;
            let cumulative = 0;
            // Index of the last series with a visible value — gets the rounded top.
            let topIdx = -1;
            bucket.values.forEach((v, si) => {
              if (v > 0) topIdx = si;
            });
            return (
              <g key={bi}>
                {bucket.values.map((v, si) => {
                  if (v <= 0) return null;
                  const y0 = yScale(cumulative);
                  cumulative += v;
                  const y1 = yScale(cumulative);
                  const isTop = si === topIdx;
                  // 2px surface gap between stacked segments (shaved off the top
                  // of every non-top segment).
                  const gap = isTop ? 0 : SEGMENT_GAP;
                  const h = y0 - y1 - gap;
                  if (h < 0.5) return null;
                  const y = y1 + gap;
                  return isTop ? (
                    <path
                      key={si}
                      d={topRoundedRect(x, y, barW, y0 - y, 4)}
                      fill={series[si].color}
                    />
                  ) : (
                    <rect key={si} x={x} y={y} width={barW} height={h} fill={series[si].color} />
                  );
                })}
              </g>
            );
          })}

          {/* X tick labels */}
          {buckets.map((bucket, bi) =>
            bi % tickEvery === 0 ? (
              <text
                key={bi}
                x={bi * slotW + slotW / 2}
                y={plotH + 18}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {bucket.tick}
              </text>
            ) : null,
          )}

          {/* Hit targets — full-height slot per bucket */}
          {buckets.map((_, bi) => (
            <rect
              key={bi}
              x={bi * slotW}
              y={0}
              width={slotW}
              height={plotH}
              fill="transparent"
              onPointerEnter={() =>
                setHover({ bucket: bi, px: MARGIN.left + bi * slotW + slotW / 2 })
              }
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </g>
      </svg>

      {/* Tooltip — every series at the hovered X */}
      {hoveredBucket && (
        <div
          className="pointer-events-none absolute z-10 min-w-[180px] rounded-md border border-border bg-card px-3 py-2 shadow-lg"
          style={{ left: tooltipLeft, top: 8, transform: 'translateX(-50%)' }}
        >
          <div className="text-xs font-medium text-foreground mb-1.5">
            {hoveredBucket.label}
          </div>
          <div className="flex flex-col gap-1">
            {series.map((s, si) => (
              <div key={s.key} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                  <span
                    aria-hidden
                    className="inline-block w-3 flex-shrink-0 rounded-full"
                    style={{ height: 3, background: s.color }}
                  />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="tabular-nums font-medium text-foreground flex-shrink-0">
                  {formatValue(hoveredBucket.values[si])}
                </span>
              </div>
            ))}
            {series.length > 1 && (
              <div className="flex items-center justify-between gap-4 text-xs border-t border-border pt-1 mt-0.5">
                <span className="text-muted-foreground pl-[18px]">Total</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {formatValue(hoveredBucket.values.reduce((sum, v) => sum + v, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
