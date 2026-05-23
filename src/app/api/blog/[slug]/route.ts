import { NextRequest } from "next/server";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { findStaticBlogPost } from "@/data/blog";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const publicPostWhere = (slug: string, locale: string) => ({
  slug_locale: { slug, locale },
  status: PostStatus.PUBLISHED,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
});

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    const post = await prisma.blogPost.findFirst({
      where: publicPostWhere(params.slug, locale),
    }) || (locale !== defaultLocale
      ? await prisma.blogPost.findFirst({
          where: publicPostWhere(params.slug, defaultLocale),
        })
      : null);

    if (!post) {
      const fallback = findStaticBlogPost(params.slug);
      if (fallback) return jsonWithRequestId({ post: fallback, locale: defaultLocale, fallback: true }, undefined, request);
      return jsonWithRequestId({ error: "Post not found" }, { status: 404 }, request);
    }

    return jsonWithRequestId({ post, locale }, undefined, request);
  } catch (error) {
    logApiError("blog.detail", error, request, { slug: params.slug });
    const fallback = findStaticBlogPost(params.slug);
    if (fallback) return jsonWithRequestId({ post: fallback, locale: defaultLocale, fallback: true }, undefined, request);
    return jsonWithRequestId({ error: "Failed to fetch blog post" }, { status: 500 }, request);
  }
}
