"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, DollarSign, Eye, Globe2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Course {
  id: string;
  name: string;
  slug: string;
  duration: string;
  summary: string;
  description: string;
  priceFrom: number;
  priceFull: number | null;
  image: string | null;
  translations: Record<string, unknown> | null;
  isActive: boolean;
  _count?: {
    batches: number;
  };
}

type TranslationLocale = "es" | "de" | "fr" | "ru" | "ko" | "zh" | "ja";

type CourseTranslation = {
  name: string;
  duration: string;
  summary: string;
  description: string;
  image: string;
};

type CourseForm = {
  name: string;
  slug: string;
  duration: string;
  summary: string;
  description: string;
  priceFrom: string;
  priceFull: string;
  image: string;
  translations: Record<TranslationLocale, CourseTranslation>;
  isActive: boolean;
};

const translationLocales: Array<{ code: TranslationLocale; label: string }> = [
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "ru", label: "Russian" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
];

const emptyTranslation = (): CourseTranslation => ({
  name: "",
  duration: "",
  summary: "",
  description: "",
  image: "",
});

const createEmptyTranslations = (): Record<TranslationLocale, CourseTranslation> =>
  translationLocales.reduce(
    (acc, locale) => ({
      ...acc,
      [locale.code]: emptyTranslation(),
    }),
    {} as Record<TranslationLocale, CourseTranslation>,
  );

const normalizeTranslations = (value: unknown): Record<TranslationLocale, CourseTranslation> => {
  const normalized = createEmptyTranslations();
  if (!value || typeof value !== "object") {
    return normalized;
  }

  for (const locale of translationLocales) {
    const source = (value as Record<string, unknown>)[locale.code];
    if (!source || typeof source !== "object") continue;
    const record = source as Partial<Record<keyof CourseTranslation, unknown>>;
    normalized[locale.code] = {
      name: typeof record.name === "string" ? record.name : "",
      duration: typeof record.duration === "string" ? record.duration : "",
      summary: typeof record.summary === "string" ? record.summary : "",
      description: typeof record.description === "string" ? record.description : "",
      image: typeof record.image === "string" ? record.image : "",
    };
  }

  return normalized;
};

const compactTranslations = (translations: Record<TranslationLocale, CourseTranslation>) => {
  const compacted: Record<string, Partial<CourseTranslation>> = {};

  for (const locale of translationLocales) {
    const entry = translations[locale.code];
    const fields = Object.fromEntries(
      Object.entries(entry)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => Boolean(value)),
    ) as Partial<CourseTranslation>;

    if (Object.keys(fields).length > 0) {
      compacted[locale.code] = fields;
    }
  }

  return Object.keys(compacted).length > 0 ? compacted : undefined;
};

const emptyForm: CourseForm = {
  name: "",
  slug: "",
  duration: "",
  summary: "",
  description: "",
  priceFrom: "0",
  priceFull: "",
  image: "",
  translations: createEmptyTranslations(),
  isActive: true,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTranslationLocale, setActiveTranslationLocale] = useState<TranslationLocale>("de");

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/courses", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load courses");
      }
      setCourses(result.courses || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        [course.name, course.slug, course.duration].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [courses, search],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, translations: createEmptyTranslations() });
    setActiveTranslationLocale("de");
  };

  const updateTranslation = (field: keyof CourseTranslation, value: string) => {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeTranslationLocale]: {
          ...current.translations[activeTranslationLocale],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        priceFrom: Number(form.priceFrom),
        priceFull: form.priceFull ? Number(form.priceFull) : null,
        translations: compactTranslations(form.translations),
      };

      const response = await fetch("/api/admin/courses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save course");
      }
      resetForm();
      await loadCourses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete course");
      }
      if (editingId === id) {
        resetForm();
      }
      await loadCourses();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-500">Create, edit, and retire course catalog entries.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={resetForm}>
          <Plus size={16} className="mr-2" /> New Course
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-6 xl:grid-cols-[360px,1fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Course" : "Create Course"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Course name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
            <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} />
            <Input placeholder="Duration" value={form.duration} onChange={(e) => setForm((current) => ({ ...current, duration: e.target.value }))} />
            <Input placeholder="Short summary" value={form.summary} onChange={(e) => setForm((current) => ({ ...current, summary: e.target.value }))} />
            <textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Globe2 className="h-4 w-4 text-orange-500" />
                  Optional translations
                </div>
                <select
                  className="rounded-md border bg-white px-2 py-1 text-xs"
                  value={activeTranslationLocale}
                  onChange={(event) => setActiveTranslationLocale(event.target.value as TranslationLocale)}
                >
                  {translationLocales.map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder={`${translationLocales.find((locale) => locale.code === activeTranslationLocale)?.label} course name`}
                  value={form.translations[activeTranslationLocale].name}
                  onChange={(event) => updateTranslation("name", event.target.value)}
                />
                <Input
                  placeholder="Translated duration"
                  value={form.translations[activeTranslationLocale].duration}
                  onChange={(event) => updateTranslation("duration", event.target.value)}
                />
                <Input
                  placeholder="Translated image URL, optional"
                  value={form.translations[activeTranslationLocale].image}
                  onChange={(event) => updateTranslation("image", event.target.value)}
                />
                <textarea
                  className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  placeholder="Translated short summary"
                  value={form.translations[activeTranslationLocale].summary}
                  onChange={(event) => updateTranslation("summary", event.target.value)}
                />
                <textarea
                  className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  placeholder="Translated full description"
                  value={form.translations[activeTranslationLocale].description}
                  onChange={(event) => updateTranslation("description", event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Price from" type="number" value={form.priceFrom} onChange={(e) => setForm((current) => ({ ...current, priceFrom: e.target.value }))} />
              <Input placeholder="Full price" type="number" value={form.priceFull} onChange={(e) => setForm((current) => ({ ...current, priceFull: e.target.value }))} />
            </div>
            <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm((current) => ({ ...current, image: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
              Active
            </label>
            <div className="flex gap-2">
              <Button className="flex-1 bg-gray-900 hover:bg-black text-white" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingId ? "Save Changes" : "Create Course"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="max-w-sm">
            <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading courses...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="border-0 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl bg-orange-100 p-3">
                        <BookOpen className="h-6 w-6 text-orange-500" />
                      </div>
                      <Badge className={course.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                        {course.isActive ? "active" : "inactive"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                    <p className="mb-3 text-sm text-gray-500">/{course.slug}</p>
                    <p className="mb-4 text-sm text-gray-600">{course.summary}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2"><Clock size={14} />{course.duration}</div>
                      <div className="flex items-center gap-2"><DollarSign size={14} />From EUR {course.priceFrom}{course.priceFull ? ` / EUR ${course.priceFull}` : ""}</div>
                      <div className="flex items-center gap-2"><Eye size={14} />{course._count?.batches || 0} batches</div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditingId(course.id);
                          setForm({
                            name: course.name,
                            slug: course.slug,
                            duration: course.duration,
                            summary: course.summary,
                            description: course.description,
                            priceFrom: String(course.priceFrom),
                            priceFull: course.priceFull ? String(course.priceFull) : "",
                            image: course.image || "",
                            translations: normalizeTranslations(course.translations),
                            isActive: course.isActive,
                          });
                        }}
                      >
                        <Save size={14} className="mr-1" /> Edit
                      </Button>
                      <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(course.id)} disabled={saving}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
