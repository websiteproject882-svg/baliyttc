import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { getInstructor, instructors } from "@/data/instructors";
import { getPublicBaseUrl } from "@/lib/public-url";

const locales = ["en", "es", "de", "fr", "id", "ko", "zh", "ja", "ru"];
const baseUrl = getPublicBaseUrl();

const profileFocus = [
  "Detailed technique explained in simple language",
  "Practical teaching feedback during training",
  "Respect for classical yoga lineage and modern student safety",
];

export function generateStaticParams() {
  return instructors.flatMap((instructor) =>
    locales.map((locale) => ({
      locale,
      slug: instructor.slug,
    })),
  );
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const instructor = getInstructor(params.slug);
  if (!instructor) return {};

  const description = `${instructor.name} is ${instructor.title} at Bali YTTC in Ubud, Bali, teaching ${instructor.specializations.slice(0, 3).join(", ")} with ${instructor.experience} experience.`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${instructor.name} Yoga Teacher | Bali YTTC`,
    description,
    openGraph: {
      title: `${instructor.name} Yoga Teacher | Bali YTTC`,
      description,
      url: `${baseUrl}/${params.locale}/instructors/${instructor.slug}`,
      images: [{ url: instructor.photo.startsWith("http") ? instructor.photo : `${baseUrl}${instructor.photo}`, alt: `${instructor.name} at Bali YTTC` }],
    },
  };
}

export default function InstructorDetailPage({ params }: { params: { locale: string; slug: string } }) {
  const instructor = getInstructor(params.slug);
  if (!instructor) notFound();

  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-32 pb-20 md:pt-40">
        <div className="container-edit">
          <Link href={`/${params.locale}/instructors`} className="inline-flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-warm-dark transition hover:border-terra hover:text-terra">
            <ArrowLeft className="h-4 w-4" />
            All teachers
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[430px_1fr] lg:items-center">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-sand bg-sand shadow-sm">
              <Image src={instructor.photo} alt={`${instructor.name}, ${instructor.title}`} fill sizes="(min-width: 1024px) 430px, 100vw" className="object-cover" priority />
              <div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-wide text-warm-dark shadow-sm">
                {instructor.experience}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{instructor.title}</p>
              <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl md:text-7xl">{instructor.name}</h1>
              <p className="mt-4 text-base font-semibold text-terra md:text-lg">{instructor.credential}</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-ink-soft md:text-lg">{instructor.bio}</p>

              <div className="mt-7 flex flex-wrap gap-2">
                {instructor.specializations.map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-warm-mid shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-edit grid gap-8 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Teacher profile</p>
            <h2 className="mt-4 text-3xl font-bold text-warm-dark md:text-4xl">What students learn with {instructor.name.split(" ")[0]}</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              This profile helps students understand the teacher's role before arriving in Bali, especially for course selection and learning expectations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-sand bg-cream p-5">
              <Award className="h-5 w-5 text-terra" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-warm-mid">Role</p>
              <p className="mt-1 font-semibold text-warm-dark">{instructor.title}</p>
            </div>
            <div className="rounded-lg border border-sand bg-cream p-5">
              <GraduationCap className="h-5 w-5 text-terra" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-warm-mid">Credential</p>
              <p className="mt-1 font-semibold text-warm-dark">{instructor.credential}</p>
            </div>
            <div className="rounded-lg border border-sand bg-cream p-5">
              <Clock className="h-5 w-5 text-terra" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-warm-mid">Experience</p>
              <p className="mt-1 font-semibold text-warm-dark">{instructor.experience}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="container-edit grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-sand bg-white p-6 md:p-8">
            <BookOpen className="h-6 w-6 text-terra" />
            <h2 className="mt-4 text-2xl font-bold text-warm-dark">Teaching approach</h2>
            <p className="mt-4 leading-8 text-ink-soft">
              {instructor.name} teaches with a practical balance of discipline and care. Students are encouraged to understand the foundation behind each practice, ask questions and build confidence step by step.
            </p>
          </div>

          <div className="rounded-lg border border-sand bg-white p-6 md:p-8">
            <h2 className="text-2xl font-bold text-warm-dark">Best suited for students who want</h2>
            <ul className="mt-5 space-y-4">
              {profileFocus.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-7 text-ink-soft">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-edit flex flex-col gap-4 rounded-lg border border-sand bg-cream p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">Ready to train in Bali?</p>
            <h2 className="mt-2 text-2xl font-bold text-warm-dark">Ask admissions which course fits your goals.</h2>
          </div>
          <Link href={`/${params.locale}/apply`} className="inline-flex justify-center rounded-full bg-terra px-6 py-3 text-sm font-bold text-white transition hover:bg-terra-deep">
            Apply for 2026 batch
          </Link>
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
