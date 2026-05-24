import { NextRequest } from "next/server";
import { PostStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { findStaticBlogPost } from "@/data/blog";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const slugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/);

const publicPostWhere = (slug: string, locale: string) => ({
  slug_locale: { slug, locale },
  OR: [
    { status: PostStatus.PUBLISHED, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
  ],
});

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const parsedSlug = slugSchema.safeParse(params.slug);
  if (!parsedSlug.success) {
    return jsonWithRequestId(
      { error: "Validation failed", details: parsedSlug.error.errors },
      { status: 400 },
      request,
    );
  }
  const slug = parsedSlug.data;

  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    const post = await prisma.blogPost.findFirst({
      where: publicPostWhere(slug, locale),
    }) || (locale !== defaultLocale
      ? await prisma.blogPost.findFirst({
          where: publicPostWhere(slug, defaultLocale),
        })
      : null);

    if (!post) {
      const fallback = findStaticBlogPost(slug);
      if (fallback) return jsonWithRequestId({ post: fallback, locale: defaultLocale, fallback: true }, undefined, request);
      return jsonWithRequestId({ error: "Post not found" }, { status: 404 }, request);
    }

    return jsonWithRequestId({ post, locale }, undefined, request);
  } catch (error) {
    logApiError("blog.detail", error, request, { slug });
    const fallback = findStaticBlogPost(slug);
    if (fallback) return jsonWithRequestId({ post: fallback, locale: defaultLocale, fallback: true }, undefined, request);
    return jsonWithRequestId({ error: "Failed to fetch blog post" }, { status: 500 }, request);
  }
}
