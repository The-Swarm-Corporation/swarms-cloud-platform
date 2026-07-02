import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/apps', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/workbench', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/playground', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/workflow-builder', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/prompts', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/agents', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/swarms', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/sdks', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/models', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/learn-more', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/observability', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/history', changeFrequency: 'daily', priority: 0.5 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/signup', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
