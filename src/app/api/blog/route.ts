import { NextRequest, NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { STATIC_BLOG_POSTS } from "@/data/blog";

export const dynamic = "force-dynamic";

const publicBlogWhere = (locale: string, category: string | null) => ({
  status: PostStatus.PUBLISHED,
  locale,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  ...(category ? { category } : {}),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
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

    return NextResponse.json({
      posts: mergedPosts,
      locale,
      pagination: { page, limit, total: mergedTotal, totalPages: Math.ceil(mergedTotal / limit) },
    });
  } catch (error) {
    console.error("GET blog error:", error);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const category = searchParams.get("category");
    const posts = STATIC_BLOG_POSTS
      .filter((post) => !category || post.category === category)
      .slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      posts,
      locale: defaultLocale,
      fallback: true,
      pagination: {
        page,
        limit,
        total: STATIC_BLOG_POSTS.length,
        totalPages: Math.ceil(STATIC_BLOG_POSTS.length / limit),
      },
    });
  }
}
