import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { IMG } from "@/data/site";
import { defaultLocale } from "@/i18n/routing";
import { findStaticBlogPost } from "@/data/blog";
import { normalizeLocale } from "@/lib/localized-content";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BlogPostPageParams = {
  params: {
    locale: string;
    slug: string;
  };
};

type PublicBlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  author: string;
  publishedAt: Date | string | null;
  readTime: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");

const publicPostWhere = (slug: string, locale: string) => ({
  slug_locale: { slug, locale },
  OR: [
    { status: PostStatus.PUBLISHED, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
  ],
});

async function getBlogPost(slug: string, localeParam: string): Promise<PublicBlogPost | null> {
  const locale = normalizeLocale(localeParam);

  try {
    const post =
      (await prisma.blogPost.findFirst({
        where: publicPostWhere(slug, locale),
      })) ||
      (locale !== defaultLocale
        ? await prisma.blogPost.findFirst({
            where: publicPostWhere(slug, defaultLocale),
          })
        : null);

    if (post) return post;
  } catch {
    // Static fallback keeps seeded articles available during DB outages.
  }

  return findStaticBlogPost(slug) || null;
}

function formatDate(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: BlogPostPageParams): Promise<Metadata> {
  const post = await getBlogPost(params.slug, params.locale);
  if (!post) {
    return {
      title: "Blog Post Not Found | Bali YTTC",
      robots: { index: false, follow: false },
    };
  }

  const title = post.metaTitle || `${post.title} | Bali YTTC`;
  const description = post.metaDescription || post.excerpt;
  const url = `${baseUrl}/${params.locale}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageParams) {
  const post = await getBlogPost(params.slug, params.locale);
  if (!post) notFound();

  const publishedDate = formatDate(post.publishedAt);

  return (
    <NextLayoutWrapper>
      <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-32">
        <article className="container-wide max-w-4xl">
          <Link href="/blog" className="label-caps mb-8 inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-[#F04E23]">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {post.category ? (
                <span className="label-caps rounded-full bg-[#F04E23]/10 px-3 py-1 text-[#F04E23]">
                  {post.category}
                </span>
              ) : null}
              {publishedDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {publishedDate}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime || 5} min read
              </span>
              {post.author ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
              ) : null}
            </div>
            <h1 className="display-xl text-gray-950">{post.title}</h1>
            {post.excerpt ? <p className="body-lg mt-5 text-gray-600">{post.excerpt}</p> : null}
          </div>

          <div className="mb-10 overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={post.featuredImage || IMG.classMain}
              alt={post.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-10">
            <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700">{post.content}</div>
            {post.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </main>
    </NextLayoutWrapper>
  );
}
