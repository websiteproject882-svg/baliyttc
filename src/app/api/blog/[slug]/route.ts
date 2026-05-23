import { NextRequest, NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { findStaticBlogPost } from "@/data/blog";

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
      if (fallback) return NextResponse.json({ post: fallback, locale: defaultLocale, fallback: true });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post, locale });
  } catch (error) {
    console.error("GET blog post error:", error);
    const fallback = findStaticBlogPost(params.slug);
    if (fallback) return NextResponse.json({ post: fallback, locale: defaultLocale, fallback: true });
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}
