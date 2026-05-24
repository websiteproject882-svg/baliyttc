import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, CheckCircle2, Users } from "lucide-react";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { instructors } from "@/data/instructors";

const facultyStats = [
  { label: "Combined teaching experience", value: "55+ years" },
  { label: "Core training styles", value: "Hatha, Ashtanga, Vinyasa" },
  { label: "Student support model", value: "Small-batch mentorship" },
];

const teachingStandards = [
  "Daily practice guided by senior teachers, not rotating assistants",
  "Alignment, anatomy and adjustment work taught with safety-first methods",
  "Philosophy classes connected to real teaching situations and student life",
  "Feedback after practice teaching so students graduate with classroom confidence",
];

export default function InstructorsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container-edit grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Meet your teachers</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl md:text-7xl">
              Learn from guides who live the practice
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg">
              The Bali YTTC faculty brings classical yoga lineage, modern anatomy, Balinese warmth and clear mentorship into one small-batch training environment.
            </p>
          </div>

          <div className="rounded-lg border border-sand bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-terra">Faculty promise</p>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              Students are taught by experienced teachers who can explain the why behind practice, not only demonstrate the shape of a posture.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream pb-10">
        <div className="container-edit grid gap-4 md:grid-cols-3">
          {facultyStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-sand bg-white p-5">
              <p className="text-2xl font-bold text-warm-dark">{stat.value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-warm-mid">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream pb-24">
        <div className="container-edit grid gap-7 lg:grid-cols-2">
          {instructors.map((teacher) => (
            <article key={teacher.slug} className="overflow-hidden rounded-lg border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid gap-0 sm:grid-cols-[210px_1fr]">
                <div className="relative min-h-[300px] bg-sand sm:min-h-full">
                  <Image
                    src={teacher.photo}
                    alt={`${teacher.name}, ${teacher.title} at Bali YTTC`}
                    fill
                    sizes="(min-width: 1024px) 210px, (min-width: 640px) 210px, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-warm-dark shadow-sm">
                    {teacher.experience}
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-terra">{teacher.title}</p>
                  <h2 className="mt-2 text-2xl font-bold text-warm-dark">{teacher.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-leaf">{teacher.credential}</p>
                  <p className="mt-4 text-sm leading-7 text-ink-soft">{teacher.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {teacher.specializations.map((item) => (
                      <span key={item} className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warm-mid">
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link href={`/${locale}/instructors/${teacher.slug}`} className="mt-5 inline-flex rounded-full border border-terra px-4 py-2 text-sm font-bold text-terra transition hover:bg-terra hover:text-white">
                    Read full profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-edit grid gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">How you are supported</p>
            <h2 className="mt-4 text-3xl font-bold text-warm-dark md:text-4xl">Clear teaching, honest feedback and safe progression</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              Every teacher brings a different strength, but the training standard is consistent: practical, grounded and easy to apply when you begin teaching real students.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {teachingStandards.map((standard) => (
              <div key={standard} className="rounded-lg border border-sand bg-cream p-5">
                <CheckCircle2 className="h-5 w-5 text-leaf" />
                <p className="mt-3 text-sm leading-7 text-ink-soft">{standard}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="container-edit grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-sand bg-white p-6">
            <Award className="h-6 w-6 text-terra" />
            <h3 className="mt-4 font-bold text-warm-dark">Certified experience</h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">Yoga Alliance level teaching with senior credentials across RYT, E-RYT and university-level yogic science study.</p>
          </div>
          <div className="rounded-lg border border-sand bg-white p-6">
            <BookOpen className="h-6 w-6 text-terra" />
            <h3 className="mt-4 font-bold text-warm-dark">Theory made useful</h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">Anatomy, philosophy and methodology are taught as practical tools for class planning, cueing and student care.</p>
          </div>
          <div className="rounded-lg border border-sand bg-white p-6">
            <Users className="h-6 w-6 text-terra" />
            <h3 className="mt-4 font-bold text-warm-dark">Personal mentorship</h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">Small cohorts allow teachers to notice your practice, help your confidence and answer questions directly.</p>
          </div>
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
