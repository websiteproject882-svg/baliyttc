"use client";

import { useEffect, useState } from "react";
import { Camera, Loader2, Mail, Save, UserCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileForm = {
  email: string;
  displayName: string;
  photoURL: string;
  phone: string;
  nationality: string;
  dietaryRequirements: string;
  yogaExperience: string;
  emergencyContact: string;
  enrolledCourse: string;
  batchName: string;
  paymentStatus: string;
  accessLevel: string;
};

const EMPTY_FORM: ProfileForm = {
  email: "",
  displayName: "",
  photoURL: "",
  phone: "",
  nationality: "",
  dietaryRequirements: "",
  yogaExperience: "",
  emergencyContact: "",
  enrolledCourse: "",
  batchName: "",
  paymentStatus: "",
  accessLevel: "",
};

export default function StudentProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void fetch("/api/app/profile")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load profile");
        }
        return result;
      })
      .then((result) => setForm({ ...EMPTY_FORM, ...result }))
      .catch((err) => setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadPhoto = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateField("photoURL", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/app/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }
      setStatus({ type: "success", message: "Profile saved." });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500">Keep your contact, travel, and learning details updated.</p>
        </div>
        <Badge className="w-fit bg-orange-50 text-orange-700 hover:bg-orange-50">
          {form.accessLevel || "Student"}
        </Badge>
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserCircle2 className="h-5 w-5 text-orange-500" />
            Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {status && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm md:col-span-2 ${
                status.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}
          <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-orange-100 to-amber-100">
                {form.photoURL ? (
                  <img src={form.photoURL} alt={form.displayName || "Student"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-orange-700">
                    {(form.displayName || form.email || "S")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-gray-900">{form.displayName || "Student"}</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  {form.email}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {form.enrolledCourse || "Course pending"}{form.batchName ? ` - ${form.batchName}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="w-fit bg-white">
                {form.paymentStatus?.replaceAll("_", " ") || "Payment pending"}
              </Badge>
            </div>
          </div>

          <label className="space-y-2 text-sm text-gray-700">
            <span className="font-medium">Full Name</span>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="font-medium">Profile Photo URL</span>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
                value={form.photoURL}
                onChange={(e) => updateField("photoURL", e.target.value)}
                disabled={loading}
                placeholder="https://..."
              />
            </div>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-orange-700"
              onChange={(event) => uploadPhoto(event.target.files?.[0])}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="font-medium">Phone</span>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="font-medium">Nationality</span>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.nationality}
              onChange={(e) => updateField("nationality", e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700 md:col-span-2">
            <span className="font-medium">Dietary Requirements</span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.dietaryRequirements}
              onChange={(e) => updateField("dietaryRequirements", e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700 md:col-span-2">
            <span className="font-medium">Yoga Experience</span>
            <textarea
              className="min-h-[140px] w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.yogaExperience}
              onChange={(e) => updateField("yogaExperience", e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="space-y-2 text-sm text-gray-700 md:col-span-2">
            <span className="font-medium">Emergency Contact</span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-gray-200 px-3 py-2 outline-none ring-0 focus:border-orange-300"
              value={form.emergencyContact}
              onChange={(e) => updateField("emergencyContact", e.target.value)}
              disabled={loading}
            />
          </label>
          <div className="md:col-span-2">
            <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={saveProfile} disabled={loading || saving}>
              {saving || loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
