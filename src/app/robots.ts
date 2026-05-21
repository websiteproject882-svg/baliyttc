import type { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://baliyttc.com').replace(/\/$/, '');

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
