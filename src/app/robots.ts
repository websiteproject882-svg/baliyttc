import type { MetadataRoute } from 'next';
import { getPublicBaseUrl } from '../lib/public-url';

const baseUrl = getPublicBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/*/admin', '/app', '/*/app', '/staff', '/*/staff', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
