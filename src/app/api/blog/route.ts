import { NextRequest } from "next/server";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { STATIC_BLOG_POSTS } from "@/data/blog";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

const publicBlogWhere = (locale: string, category: string | null) => ({
  status: PostStatus.PUBLISHED,
  locale,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  ...(category ? { category } : {}),
});

function getPositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.max(Math.trunc(parsed), 1);
  return max ? Math.min(normalized, max) : normalized;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
    const page = getPositiveInt(searchParams.get("page"), 1);
    const locale = normalizeLocale(searchParams.get("locale"));

    const where = publicBlogWhere(locale, category);

    let [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          tags: true,
          author: true,
          publishedAt: true,
          readTime: true,
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    if (posts.length === 0 && locale !== defaultLocale) {
      const fallbackWhere = publicBlogWhere(defaultLocale, category);
      [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where: fallbackWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
            category: true,
            tags: true,
            author: true,
            publishedAt: true,
            readTime: true,
          },
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where: fallbackWhere }),
      ]);
    }

    const dbSlugs = new Set(posts.map((post) => post.slug));
    const staticMissing = STATIC_BLOG_POSTS
      .filter((post) => !category || post.category === category)
      .filter((post) => !dbSlugs.has(post.slug));
    const mergedPosts = [...posts, ...staticMissing]
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit);
    const mergedTotal = Math.max(total, posts.length + staticMissing.length);

    return jsonWithRequestId({
      posts: mergedPosts,
      locale,
      pagination: { page, limit, total: mergedTotal, totalPages: Math.ceil(mergedTotal / limit) },
    }, undefined, request);
  } catch (error) {
    logApiError("blog.list", error, request);
    const { searchParams } = new URL(request.url);
    const limit = getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
    const page = getPositiveInt(searchParams.get("page"), 1);
    const category = searchParams.get("category");
    const filteredPosts = STATIC_BLOG_POSTS.filter((post) => !category || post.category === category);
    const posts = filteredPosts
      .slice((page - 1) * limit, page * limit);

    return jsonWithRequestId({
      posts,
      locale: defaultLocale,
      fallback: true,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit),
      },
    }, undefined, request);
  }
}
