"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TestimonialItem = {
  id: string;
  rating: number;
  quote: string;
  location?: string | null;
  courseName?: string | null;
  graduationYear?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type PortalProfile = {
  student: {
    accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
    enrolledCourse?: string | null;
    batch?: { course?: { name: string } | null } | null;
    nationality?: string | null;
  };
};

export default function StudentReviewsPage() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<PortalProfile["student"]["accessLevel"]>("PRE_ARRIVAL");
  const [form, setForm] = useState({
    rating: 5,
    quote: "",
    location: "",
    courseName: "",
    graduationYear: String(new Date().getFullYear()),
  });

  const loadTestimonials = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/app/testimonials", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load reviews");
      }
      setItems(result.testimonials || []);
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof Error ? error.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTestimonials();
    void fetch("/api/app/portal", { cache: "no-store" })
      .then(async (response) => {
        const result: PortalProfile = await response.json();
        if (!response.ok) return;
        setAccessLevel(result.student.accessLevel);
        setForm((current) => ({
          ...current,
          courseName: current.courseName || result.student.batch?.course?.name || result.student.enrolledCourse || "",
          location: current.location || result.student.nationality || "",
        }));
      })
      .catch(() => undefined);
  }, []);

  const submit = async () => {
    if (accessLevel !== "FULL" && accessLevel !== "ALUMNI") {
      setMessage("Website testimonials unlock after full course access is active.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/app/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: form.rating,
          quote: form.quote,
          location: form.location,
          courseName: form.courseName,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Could not submit testimonial");
      }
      setForm({
        rating: 5,
        quote: "",
        location: "",
        courseName: "",
        graduationYear: String(new Date().getFullYear()),
      });
      await loadTestimonials();
      setMessage("Testimonial submitted for admin approval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit testimonial.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        <div className="space-y-4">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ExternalLink className="h-5 w-5 text-orange-500" />
                Leave Public Review
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="justify-between bg-orange-500 text-white hover:bg-orange-600">
                <a href="https://www.google.com/search?q=Bali+Yoga+Teacher+Training+Center+reviews" target="_blank" rel="noreferrer">
                  Google Review
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <a href="https://www.tripadvisor.com/Search?q=Bali%20Yoga%20Teacher%20Training%20Center" target="_blank" rel="noreferrer">
                  TripAdvisor Review
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                Submit Website Testimonial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                  {message}
                </div>
              )}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button key={rating} type="button" variant={form.rating === rating ? "default" : "outline"} className="px-2" onClick={() => setForm((current) => ({ ...current, rating }))}>
                    <Star className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{rating}</span>
                    <span className="sr-only">{rating} stars</span>
                  </Button>
                ))}
              </div>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Location" value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} />
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Course name" value={form.courseName} onChange={(e) => setForm((current) => ({ ...current, courseName: e.target.value }))} />
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Graduation year" value={form.graduationYear} onChange={(e) => setForm((current) => ({ ...current, graduationYear: e.target.value }))} />
              <textarea className="min-h-[220px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Describe your experience in detail." value={form.quote} onChange={(e) => setForm((current) => ({ ...current, quote: e.target.value }))} />
              {accessLevel !== "FULL" && accessLevel !== "ALUMNI" ? (
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                  You can draft your review now. Website submission opens after your full course access is active.
                </div>
              ) : null}
              <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={submit} disabled={saving || form.quote.trim().length < 30 || (accessLevel !== "FULL" && accessLevel !== "ALUMNI")}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit for approval
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {loadError && (
            <Card className="border border-red-200 bg-red-50 shadow-sm">
              <CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent>
            </Card>
          )}
          {loading ? (
            <div className="p-8 text-gray-500">Loading reviews...</div>
          ) : items.length === 0 ? (
            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-6 text-sm text-gray-500">No review submissions yet.</CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="border-0 bg-white shadow-sm">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-orange-500">
                      {Array.from({ length: item.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </div>
                    <Badge className={item.status === "APPROVED" ? "bg-green-100 text-green-800" : item.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                      {item.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-gray-700">{item.quote}</p>
                  <p className="text-xs text-gray-500">
                    {[item.courseName, item.location, item.graduationYear].filter(Boolean).join(" - ")}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
