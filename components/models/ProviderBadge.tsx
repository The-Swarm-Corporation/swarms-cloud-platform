import React from 'react';
import { Cpu } from 'lucide-react';
import { providerVisual } from '@/lib/models/catalog';

/**
 * Colored provider monogram badge; falls back to the generic Cpu icon when
 * the provider is unknown.
 */
export function ProviderBadge({
  provider,
  size = 'sm',
  className = '',
}: {
  provider: string | null;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const visual = providerVisual(provider);
  const box =
    size === 'lg' ? 'w-10 h-10 rounded-lg text-sm' : 'w-7 h-7 rounded-md text-[10px]';

  if (!visual) {
    return (
      <div
        className={`${box} bg-subtle border border-border flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <Cpu
          className={`${
            size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
          } text-muted-foreground`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${box} border flex items-center justify-center flex-shrink-0 font-semibold ${className}`}
      style={{
        backgroundColor: `${visual.color}1a`,
        borderColor: `${visual.color}4d`,
        color: visual.color,
      }}
      title={visual.label}
      aria-label={visual.label}
    >
      {visual.monogram}
    </div>
  );
}
