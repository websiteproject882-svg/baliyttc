"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Search, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { IMG } from "@/data/site";
import { STATIC_BLOG_POSTS } from "@/data/blog";
import { getPageCopy } from "@/lib/page-i18n";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
}

const POSTS_PER_PAGE = 6;

type BlogProps = {
  initialPosts?: BlogPost[];
};

const Blog = ({ initialPosts = [] }: BlogProps) => {
  const locale = useLocale();
  const copy = getPageCopy(locale, "pageHero");
  const params = useParams<{ locale: string }>();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/blog?locale=${params?.locale || "en"}&limit=60`);
        const data = await res.json();
        setPosts(data.posts?.length ? data.posts : initialPosts.length ? initialPosts : STATIC_BLOG_POSTS);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setPosts(initialPosts.length ? initialPosts : STATIC_BLOG_POSTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [initialPosts, params?.locale]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const categories = useMemo(() => {
    const names = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
    return ["All", ...names.sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, posts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const recentPosts = posts.slice(0, 5);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    if (currentPage > 3) pages.push(-1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) pages.push(-2);
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.setTimeout(() => {
      document.querySelector("#blog-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const categoryCount = (category: string) =>
    category === "All" ? posts.length : posts.filter((post) => post.category === category).length;

  const BlogCard = ({ post, featured = false }: { post: BlogPost; featured?: boolean }) => (
    <motion.article
      whileHover={{ y: -4 }}
      className={`group overflow-hidden rounded-[10px] bg-white shadow-[0_16px_40px_rgba(42,36,28,0.08)] ring-1 ring-stone-200 transition-all duration-300 hover:shadow-[0_24px_60px_rgba(42,36,28,0.12)] ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <div className={`${featured ? "aspect-[16/7]" : "aspect-[16/10]"} overflow-hidden bg-stone-100`}>
          <img
            src={post.featuredImage || IMG.classMain}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = IMG.classMain;
            }}
          />
        </div>
        <div className={featured ? "p-7 md:p-9" : "p-6"}>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="label-caps rounded-full bg-[#F04E23]/10 px-3 py-1 text-[#F04E23]">
              {post.category || "Journal"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt)}
            </span>
          </div>
          <h3 className={`${featured ? "display-md" : "display-sm"} mb-3 text-gray-900 transition-colors line-clamp-2 group-hover:text-[#F04E23]`}>
            {post.title}
          </h3>
          <p className={`${featured ? "text-base md:text-lg md:leading-8" : "text-sm"} mb-5 text-gray-600 line-clamp-3`}>
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{post.author}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-32">
      <div className="container-wide">
        <Reveal>
          <Link href="/" className="label-caps mb-8 inline-block text-gray-500 transition-colors hover:text-[#F04E23]">
            {copy.backHome}
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <SectionHeading
            eyebrow={copy.blogEyebrow}
            title={<>{copy.blogTitle} <em className="text-[#F04E23]">{copy.blogAccent}</em></>}
            sub={copy.blogIntro}
          />
        </Reveal>

        <div id="blog-list" className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#F04E23]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-[10px] bg-white p-10 text-center ring-1 ring-stone-200">
                <p className="text-gray-500">No blog posts available yet.</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-[10px] bg-white p-10 text-center ring-1 ring-stone-200">
                <p className="text-gray-500">No posts match your search. Try another keyword or category.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between gap-4 text-sm text-gray-500">
                  <p>
                    Showing <span className="font-semibold text-gray-900">{paginatedPosts.length}</span> of{" "}
                    <span className="font-semibold text-gray-900">{filteredPosts.length}</span> posts
                  </p>
                  <p className="hidden sm:block">
                    Page {currentPage} / {totalPages}
                  </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {paginatedPosts.map((post, index) => (
                    <Reveal key={post.id || post.slug} delay={index * 0.06}>
                      <BlogCard post={post} featured={currentPage === 1 && index === 0 && !searchQuery && activeCategory === "All"} />
                    </Reveal>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex h-11 w-11 items-center justify-center border border-stone-200 bg-white text-gray-700 transition-colors hover:border-[#F04E23] hover:text-[#F04E23] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers.map((page, index) =>
                      page < 0 ? (
                        <span key={`ellipsis-${index}`} className="flex h-11 w-11 items-center justify-center text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => changePage(page)}
                          className={`flex h-11 min-w-11 items-center justify-center border px-4 text-sm font-semibold transition-colors ${
                            currentPage === page
                              ? "border-gray-950 bg-gray-950 text-white"
                              : "border-stone-200 bg-white text-gray-800 hover:border-[#F04E23] hover:text-[#F04E23]"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex h-11 w-11 items-center justify-center border border-stone-200 bg-white text-gray-700 transition-colors hover:border-[#F04E23] hover:text-[#F04E23] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[10px] bg-white p-6 shadow-[0_16px_40px_rgba(42,36,28,0.06)] ring-1 ring-stone-200">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Search</h2>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search articles"
                  className="h-12 w-full border border-stone-300 bg-white pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#F04E23]"
                />
              </label>
            </div>

            <div className="rounded-[10px] bg-white p-6 shadow-[0_16px_40px_rgba(42,36,28,0.06)] ring-1 ring-stone-200">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      activeCategory === category
                        ? "bg-[#F04E23]/10 font-semibold text-[#F04E23]"
                        : "text-gray-600 hover:bg-stone-50 hover:text-gray-950"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="text-xs text-gray-400">{categoryCount(category)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] bg-white p-6 shadow-[0_16px_40px_rgba(42,36,28,0.06)] ring-1 ring-stone-200">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">Recent Posts</h2>
              <div className="space-y-5">
                {recentPosts.map((post) => (
                  <Link key={post.id || post.slug} href={`/blog/${post.slug}`} className="group grid grid-cols-[82px_1fr] gap-4">
                    <img
                      src={post.featuredImage || IMG.classMain}
                      alt=""
                      className="h-20 w-20 rounded-md object-cover"
                      onError={(event) => {
                        event.currentTarget.src = IMG.classMain;
                      }}
                    />
                    <div>
                      <p className="label-caps mb-1 text-[#F04E23]">{post.category}</p>
                      <h3 className="line-clamp-3 text-sm font-semibold leading-5 text-gray-900 transition-colors group-hover:text-[#F04E23]">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">{formatDate(post.publishedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Blog;
