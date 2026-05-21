import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import { findStaticBlogPost } from "@/data/blog";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    const post = await prisma.blogPost.findUnique({
      where: { slug_locale: { slug: params.slug, locale } },
    }) || (locale !== defaultLocale
      ? await prisma.blogPost.findUnique({
          where: { slug_locale: { slug: params.slug, locale: defaultLocale } },
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
