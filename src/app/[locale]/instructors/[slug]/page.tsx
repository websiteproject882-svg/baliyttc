import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { getInstructor, instructors } from "@/data/instructors";

export function generateStaticParams() {
  return instructors.flatMap((instructor) =>
    ["en", "es", "de", "fr", "id", "ko", "zh", "ja", "ru"].map((locale) => ({
      locale,
      slug: instructor.slug,
    })),
  );
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const instructor = getInstructor(params.slug);
  if (!instructor) return {};
  return {
    title: `${instructor.name} Yoga Teacher | Bali YTTC`,
    description: `${instructor.name} is ${instructor.title} at Bali YTTC in Ubud, Bali, teaching ${instructor.specializations.slice(0, 3).join(", ")}.`,
  };
}

export default function InstructorDetailPage({ params }: { params: { slug: string } }) {
  const instructor = getInstructor(params.slug);
  if (!instructor) notFound();

  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-36 pb-20">
        <div className="container-edit grid gap-10 lg:grid-cols-[430px_1fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
            <Image src={instructor.photo} alt={instructor.name} fill className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{instructor.title}</p>
            <h1 className="mt-4 font-serif text-5xl text-warm-dark md:text-7xl">{instructor.name}</h1>
            <p className="mt-4 text-lg font-semibold text-terra">{instructor.credential} · {instructor.experience}</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-soft">{instructor.bio}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {instructor.specializations.map((item) => (
                <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-warm-mid">{item}</span>
              ))}
            </div>
            <Link href="/en/instructors" className="mt-8 inline-flex rounded-full border border-terra px-5 py-3 text-sm font-semibold text-terra">
              Back to all teachers
            </Link>
          </div>
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
