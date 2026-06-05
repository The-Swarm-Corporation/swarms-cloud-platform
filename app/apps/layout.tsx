import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Apps',
  description:
    'A directory of every page, tool, and product in Swarms Cloud, grouped by purpose with full-text search.',
  path: '/apps',
  keywords: [
    'apps directory',
    'launcher',
    'all pages',
    'tools',
    'products',
    'workspace index',
  ],
});

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
