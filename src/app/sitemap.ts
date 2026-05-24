import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { locales } from '@/i18n/routing';
import { instructors } from '../data/instructors';

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://baliyttc.com').replace(/\/$/, '');
const staticRoutes = [
  '',
  '/about',
  '/courses',
  '/apply',
  '/schedule',
  '/faq',
  '/accommodation',
  '/pricing',
  '/visa',
  '/retreats',
  '/workshops',
  '/videos',
  '/activities',
  '/gallery',
  '/instructors',
  '/yoga-alliance',
  '/testimonials',
  '/blog',
  '/contact',
  '/terms',
];

function localizedUrl(locale: string, path: string) {
  return `${baseUrl}/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let courseSlugs: string[] = ['50hr', '100hr', '200hr', '300hr'];
  let blogSlugs: string[] = [];

  try {
    const [courses, posts] = await Promise.all([
      prisma.course.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true },
      }),
    ]);

    if (courses.length > 0) {
      courseSlugs = Array.from(new Set(courses.map((course) => course.slug)));
    }
    blogSlugs = Array.from(new Set(posts.map((post) => post.slug)));
  } catch {
    // Keep sitemap generation resilient during first deploys before the DB is ready.
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: localizedUrl(locale, route),
        lastModified: now,
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
      });
    }

    for (const slug of courseSlugs) {
      entries.push({
        url: localizedUrl(locale, `/courses/${slug}`),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: slug === '200hr' ? 0.95 : 0.9,
      });
    }

    for (const instructor of instructors) {
      entries.push({
        url: localizedUrl(locale, `/instructors/${instructor.slug}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    for (const slug of blogSlugs) {
      entries.push({
        url: localizedUrl(locale, `/blog/${slug}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
