import { PostStatus } from "@prisma/client";
import Blog from "@/views/Blog";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { STATIC_BLOG_POSTS } from "@/data/blog";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BlogPageParams = {
  params: {
    locale: string;
  };
};

async function getInitialBlogPosts(localeParam: string) {
  const locale = normalizeLocale(localeParam);
  const where = {
    status: PostStatus.PUBLISHED,
    locale,
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };

  try {
    let posts = await prisma.blogPost.findMany({
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
      take: 60,
    });

    if (posts.length === 0 && locale !== defaultLocale) {
      posts = await prisma.blogPost.findMany({
        where: { ...where, locale: defaultLocale },
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
        take: 60,
      });
    }

    const dbSlugs = new Set(posts.map((post) => post.slug));
    const staticMissing = STATIC_BLOG_POSTS.filter((post) => !dbSlugs.has(post.slug));

    return [...posts, ...staticMissing]
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      })
      .map((post) => ({
        ...post,
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
        readTime: post.readTime || 5,
      }));
  } catch {
    return STATIC_BLOG_POSTS;
  }
}

export default async function BlogPage({ params }: BlogPageParams) {
  const posts = await getInitialBlogPosts(params.locale);

  return (
    <NextLayoutWrapper>
      <Blog initialPosts={posts} />
    </NextLayoutWrapper>
  );
}
