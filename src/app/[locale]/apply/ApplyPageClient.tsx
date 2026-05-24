"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

const courses = [
  { value: "50hr", label: "50-Hour Hatha Vinyasa YTT" },
  { value: "100hr", label: "100-Hour Multi-Style YTT" },
  { value: "200hr", label: "200-Hour Hatha Ashtanga Vinyasa YTT" },
  { value: "300hr", label: "300-Hour Advanced YTT" },
];

const dates = ["June 3, 2026", "July 8, 2026", "August 12, 2026", "September 9, 2026", "October 14, 2026"];
const countries = [
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Japan",
  "Netherlands",
  "Singapore",
  "Spain",
  "Switzerland",
  "United Kingdom",
  "United States",
  "Other",
];

export function ApplyPageClient() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get("course") || "200hr";
  const initialDate = searchParams.get("date") || dates[0];
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    course: initialCourse,
    date: initialDate,
    experience: "Complete beginner",
    source: "",
    message: "",
    website: "",
  });

  const whatsappLink = useMemo(() => {
    const courseLabel = courses.find((course) => course.value === form.course)?.label || form.course;
    const message = `Hi! I want to apply for the ${courseLabel} starting ${form.date}.`;
    return `https://wa.me/6281999333327?text=${encodeURIComponent(message)}`;
  }, [form.course, form.date]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: "apply-page",
        course: `${form.course} - ${form.date}`,
        message: `Country: ${form.country}\nExperience: ${form.experience}\nHeard from: ${form.source || "Not specified"}\n\n${form.message}`,
        website: form.website,
      }),
    }).catch(() => null);

    if (response?.ok) {
      setStatus("success");
      setForm((current) => ({ ...current, name: "", email: "", phone: "", message: "" }));
      return;
    }
    setStatus("error");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="rounded-lg border border-sand bg-white p-5 shadow-sm md:p-8">
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          className="hidden"
          aria-hidden="true"
          name="website"
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></Field>
          <Field label="Email address *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} /></Field>
          <Field label="Phone / WhatsApp *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} placeholder="+62..." /></Field>
          <Field label="Country of residence *">
            <select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={fieldClass}>
              <option value="">Choose country...</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </Field>
          <Field label="Which course? *">
            <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className={fieldClass}>
              {courses.map((course) => <option key={course.value} value={course.value}>{course.label}</option>)}
            </select>
          </Field>
          <Field label="Preferred start date *">
            <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={fieldClass}>
              {dates.map((date) => <option key={date} value={date}>{date}</option>)}
            </select>
          </Field>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-warm-mid">Yoga experience level</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {["Complete beginner", "Some experience", "Regular practitioner", "Teacher"].map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-md border border-sand p-3 text-sm text-warm-dark">
                <input type="radio" name="experience" checked={form.experience === item} onChange={() => setForm({ ...form, experience: item })} />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="How did you hear about us?">
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={fieldClass}>
              <option value="">Choose one</option>
              <option>Google</option>
              <option>Instagram</option>
              <option>Friend / alumni</option>
              <option>YouTube</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Message / questions">
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${fieldClass} min-h-[120px]`} />
          </Field>
        </div>

        <button disabled={status === "submitting"} className="mt-8 h-12 w-full rounded-full bg-terra px-6 font-semibold text-white hover:bg-terra-deep disabled:opacity-60">
          {status === "submitting" ? "Submitting..." : "Submit application"}
        </button>
        {status === "success" && <p className="mt-4 rounded-md bg-leaf/10 p-3 text-sm font-medium text-leaf">Application received. Admissions will contact you soon.</p>}
        {status === "error" && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">Could not submit right now. Please use WhatsApp below.</p>}
      </form>

      <aside className="space-y-5">
        <div className="rounded-lg bg-warm-dark p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terra-light">What happens next?</p>
          <ol className="mt-5 space-y-4 text-sm">
            {["Submit your application", "Get confirmation from admissions", "Pay deposit to reserve the seat", "Arrive in Ubud and begin training"].map((step) => (
              <li key={step} className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-terra-light" />{step}</li>
            ))}
          </ol>
        </div>
        <a href={whatsappLink} target="_blank" className="flex items-center justify-center gap-2 rounded-full border border-leaf bg-leaf px-5 py-4 text-sm font-semibold text-white">
          <MessageCircle className="h-5 w-5" /> Apply via WhatsApp
        </a>
        <div className="rounded-lg border border-sand bg-cream p-5 text-sm leading-7 text-ink-soft">
          <ShieldCheck className="mb-3 h-6 w-6 text-leaf" />
          No payment is required to submit this form. Your seat is reserved only after admissions confirms availability and deposit payment.
        </div>
      </aside>
    </div>
  );
}

const fieldClass = "w-full rounded-md border border-sand bg-cream px-4 py-3 text-sm text-warm-dark outline-none transition focus:border-terra focus:ring-2 focus:ring-terra/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-warm-mid">{label}</span>
      {children}
    </label>
  );
}
