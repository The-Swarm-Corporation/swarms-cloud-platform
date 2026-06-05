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
    { path: '/prompts', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/agents', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/swarms', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/sdks', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/models', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/history', changeFrequency: 'daily', priority: 0.5 },
  ];

  return routes.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
