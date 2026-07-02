import React from 'react';

/**
 * Renders a JSON-LD structured-data block. Server-safe; use in layouts and
 * pages to emit schema.org markup (BreadcrumbList, FAQPage, etc.).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
