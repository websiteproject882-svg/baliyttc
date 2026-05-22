"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Search, Edit, Trash2, Loader2, BookOpen, Tag, Globe, ChevronRight
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  locale: string;
  isActive: boolean;
}

interface FAQForm {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
  locale: string;
  isActive: boolean;
}

const defaultForm: FAQForm = {
  id: "",
  question: "",
  answer: "",
  category: "",
  keywords: "",
  locale: "en",
  isActive: true,
};

const categories = [
  "Courses",
  "Pricing",
  "Visa",
  "Accommodation",
  "Food",
  "Certification",
  "Schedule",
  "Payment",
  "Policies",
  "Location",
  "General",
];

const locales = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "ko", name: "한국어" },
  { code: "ja", name: "日本語" },
  { code: "id", name: "Bahasa" },
  { code: "zh", name: "中文" },
];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLocale, setFilterLocale] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FAQForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/faq");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch FAQs");
      }
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
      setFaqs([]);
      setError(err instanceof Error ? err.message : "Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFaqs();
  }, []);

  const openCreateDialog = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (faq: FAQItem) => {
    setForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords.join(", "),
      locale: faq.locale,
      isActive: faq.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.question || !form.answer) {
      setError("Question and answer are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const keywords = form.keywords.split(",").map(k => k.trim()).filter(Boolean);
    try {
      const response = await fetch("/api/admin/faq", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(form.id ? { id: form.id } : {}),
          question: form.question,
          answer: form.answer,
          category: form.category || "General",
          keywords,
          locale: form.locale,
          isActive: form.isActive,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save FAQ");
      }
      setDialogOpen(false);
      setForm(defaultForm);
      await fetchFaqs();
    } catch (err) {
      console.error("Failed to save FAQ:", err);
      setError(err instanceof Error ? err.message : "Failed to save FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete FAQ");
      }
      await fetchFaqs();
    } catch (err) {
      console.error("Failed to delete FAQ:", err);
      setError(err instanceof Error ? err.message : "Failed to delete FAQ");
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchSearch = !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase()) ||
      faq.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    const matchLocale = filterLocale === "all" || faq.locale === filterLocale;
    const matchCategory = filterCategory === "all" || faq.category === filterCategory;
    return matchSearch && matchLocale && matchCategory;
  });

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const key = faq.locale;
    if (!acc[key]) acc[key] = [];
    acc[key].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">Manage support bot responses and common questions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search questions, answers, keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={filterLocale}
              onChange={(e) => setFilterLocale(e.target.value)}
            >
              <option value="all">All Languages</option>
              {locales.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
            <p className="text-xs text-gray-500">Total FAQs</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{faqs.filter(f => f.isActive).length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{new Set(faqs.map(f => f.locale)).size}</p>
            <p className="text-xs text-gray-500">Languages</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{new Set(faqs.map(f => f.category)).size}</p>
            <p className="text-xs text-gray-500">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No FAQs found</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add First FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([locale, localeFaqs]) => {
            const localeInfo = locales.find(l => l.code === locale);
            return (
              <Card key={locale} className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {localeInfo?.name || locale}
                    <Badge variant="outline">{localeFaqs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localeFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className={`p-4 rounded-lg border transition-all ${
                        faq.isActive ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="text-xs">{faq.category}</Badge>
                            {!faq.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                          </div>
                          <p className="font-medium text-gray-900 mb-1">{faq.question}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{faq.answer}</p>
                          {faq.keywords.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {faq.keywords.slice(0, 5).map((k) => (
                                  <span key={k} className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {k}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(faq)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void handleDelete(faq.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
              >
                {locales.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

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
              <label className="text-sm font-medium text-gray-700 mb-1 block">Question</label>
              <Input
                placeholder="What would a user ask?"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Answer</label>
              <Textarea
                placeholder="The response the bot should give..."
                className="min-h-[100px]"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Keywords</label>
              <Input
                placeholder="course, training, program (comma-separated)"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Keywords that trigger this FAQ in the support bot</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible to bot)
              </label>
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
              ) : form.id ? (
                "Update FAQ"
              ) : (
                "Add FAQ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
