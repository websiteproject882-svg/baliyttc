"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Loader2, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { IMG } from "@/data/site";

type BlogPost = {
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string | null;
  readTime: number | null;
};

export default function BlogPostPage() {
  const params = useParams<{ locale: string; slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/blog/${params.slug}?locale=${params.locale || "en"}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Post not found");
        }
        setPost(result.post);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      void loadPost();
    }
  }, [params.locale, params.slug]);

  const publishedDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <NextLayoutWrapper>
      <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-32">
        <article className="container-wide max-w-4xl">
          <Link href="/blog" className="label-caps mb-8 inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-[#F04E23]">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#F04E23]" />
            </div>
          ) : error || !post ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <h1 className="display-md text-gray-900">Post not found</h1>
              <p className="mt-3 text-gray-500">{error || "This article is not available."}</p>
            </div>
          ) : (
            <>
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
                <h1 className="display-xl text-gray-950">
                  {post.title}
                </h1>
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
                <div className="prose prose-lg max-w-none whitespace-pre-line text-gray-700">
                  {post.content}
                </div>
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
            </>
          )}
        </article>
      </main>
    </NextLayoutWrapper>
  );
}
