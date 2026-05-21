"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Plus, Search, Edit, Trash2, Loader2, Eye, Calendar,
  Clock, Globe, Tag, X, Image, Save, Copy
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  author: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt: string | null;
  scheduledAt: string | null;
  readTime: number;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PostForm {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string;
  author: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt: string;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
}

const defaultForm: PostForm = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  category: "",
  tags: "",
  author: "",
  locale: "en",
  status: "DRAFT",
  publishedAt: "",
  scheduledAt: "",
  seoTitle: "",
  seoDescription: "",
};

const categories = [
  "Teacher Training",
  "Certification",
  "Bali Experience",
  "Yoga Philosophy",
  "Asana Practice",
  "Meditation",
  "Pranayama",
  "Teaching Methodology",
  "Lifestyle",
  "Travel",
  "Health & Wellness",
  "Student Stories",
  "Teacher Training",
];

const statusConfig = {
  DRAFT: { color: "bg-gray-100 text-gray-700", label: "Draft" },
  PUBLISHED: { color: "bg-green-100 text-green-700", label: "Published" },
  SCHEDULED: { color: "bg-blue-100 text-blue-700", label: "Scheduled" },
};

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "ru", label: "Russian" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PostForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/blog");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load posts");
      setPosts(result.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const openCreateDialog = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (post: BlogPost) => {
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage || "",
      category: post.category,
      tags: post.tags.join(", "),
      author: post.author,
      locale: post.locale || "en",
      status: post.status,
      publishedAt: post.publishedAt ? post.publishedAt.split("T")[0] : "",
      scheduledAt: post.scheduledAt ? post.scheduledAt.split("T")[0] : "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.metaDescription || "",
    });
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    const autoSlug = !form.id || form.slug === generateSlug(form.title);
    setForm({
      ...form,
      title,
      slug: autoSlug ? generateSlug(title) : form.slug,
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      setError("Title and content are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      readTime: calculateReadTime(form.content),
      publishedAt: form.status === "PUBLISHED" ? (form.publishedAt || new Date().toISOString()) : null,
      scheduledAt: form.status === "SCHEDULED" ? form.scheduledAt : null,
      featuredImage: form.featuredImage || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };

    try {
      const response = await fetch("/api/admin/blog", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save post");
      setDialogOpen(false);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete post");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const statusCounts = posts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage blog posts</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          return (
            <Card key={status} className={`border-0 bg-white shadow-sm ${count === 0 ? "opacity-50" : ""}`}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-0">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No posts found</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPosts.map((post) => {
                const status = statusConfig[post.status];
                return (
                  <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {post.featuredImage ? (
                        <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <img src={post.featuredImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={status.color}>{status.label}</Badge>
                              <Badge variant="outline" className="text-xs uppercase">{post.locale || "en"}</Badge>
                              <Badge variant="outline" className="text-xs">{post.category}</Badge>
                            </div>
                            <h3 className="font-medium text-gray-900 hover:text-orange-600 cursor-pointer">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{post.excerpt}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.publishedAt ? formatDate(post.publishedAt) : "Not published"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime} min read
                          </span>
                          <span>By {post.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                <Input
                  placeholder="Post title..."
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Slug</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="post-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, slug: generateSlug(form.title) })}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Excerpt</label>
              <Textarea
                placeholder="Brief summary for the post..."
                className="min-h-[80px]"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Content <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Write your blog post content here..."
                className="min-h-[300px] font-mono text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">
                {calculateReadTime(form.content)} min read
              </p>
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
                <Input
                  placeholder="yoga, meditation, bali (comma-separated)"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
            </div>

            {/* Author & Image */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Author</label>
                <Input
                  placeholder="Author name"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.locale}
                  onChange={(e) => setForm({ ...form, locale: e.target.value })}
                >
                  {locales.map((locale) => (
                    <option key={locale.code} value={locale.code}>{locale.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Featured Image URL</label>
                <Input
                  placeholder="https://..."
                  value={form.featuredImage}
                  onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PostForm["status"] })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Publish Now</option>
                  <option value="SCHEDULED">Schedule</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {form.status === "SCHEDULED" ? "Schedule Date" : "Publish Date"}
                </label>
                <Input
                  type="date"
                  value={form.status === "SCHEDULED" ? form.scheduledAt : form.publishedAt}
                  onChange={(e) => {
                    if (form.status === "SCHEDULED") {
                      setForm({ ...form, scheduledAt: e.target.value });
                    } else {
                      setForm({ ...form, publishedAt: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setForm({ ...form, publishedAt: new Date().toISOString().split("T")[0] })}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Today
                </Button>
              </div>
            </div>

            {/* SEO Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                SEO Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">SEO Title</label>
                  <Input
                    placeholder="Custom page title (defaults to post title)"
                    value={form.seoTitle}
                    onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">SEO Description</label>
                  <Input
                    placeholder="Meta description for search engines..."
                    value={form.seoDescription}
                    onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Optimal: Title 50-60 chars, Description 150-160 chars
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {form.id ? "Update Post" : "Create Post"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
