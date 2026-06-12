import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blogPosts';

const BASE_URL = 'https://www.elchef.se';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/rorligt-avtal',
    '/fastpris-avtal',
    '/byt-elavtal',
    '/elpriskollen',
    '/fakturaanalys',
    '/robinhood',
    '/foretag',
    '/om-oss',
    '/kontakt',
    '/vanliga-fragor',
    '/cookies',
    '/integritetspolicy',
    '/gdpr',
    '/villkor',
    '/media',
    '/media/weekly-news',
    '/media/weather-electricity-prices',
    '/media/robin-hood-electricity',
    '/kunskap',
    '/affiliate',
    '/partner',
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/fakturaanalys' || path === '/rorligt-avtal' ? 0.9 : 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/kunskap/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
