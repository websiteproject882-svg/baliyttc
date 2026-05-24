import { NextRequest } from "next/server";
import { PostStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { STATIC_BLOG_POSTS } from "@/data/blog";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;
const categorySchema = z.string().trim().min(1).max(80).optional();

const publicBlogWhere = (locale: string, category: string | null) => ({
  locale,
  OR: [
    { status: PostStatus.PUBLISHED, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
  ],
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
    const parsedCategory = categorySchema.safeParse(searchParams.get("category") ?? undefined);
    if (!parsedCategory.success) {
      return jsonWithRequestId(
        { error: "Validation failed", details: parsedCategory.error.errors },
        { status: 400 },
        request,
      );
    }
    const category = parsedCategory.data ?? null;
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
    const category = categorySchema.safeParse(searchParams.get("category") ?? undefined).success
      ? categorySchema.parse(searchParams.get("category") ?? undefined) ?? null
      : null;
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
