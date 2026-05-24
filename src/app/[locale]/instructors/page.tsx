import Image from "next/image";
import Link from "next/link";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { instructors } from "@/data/instructors";

export default function InstructorsPage() {
  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-36 pb-16">
        <div className="container-edit">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Meet your teachers</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-warm-dark md:text-7xl">
            Senior guides with lived practice
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
            Learn from teachers who bring classical lineage, modern safety, Balinese warmth and years of daily teaching experience into the shala.
          </p>
        </div>
      </section>

      <section className="bg-cream pb-24">
        <div className="container-edit grid gap-7 md:grid-cols-2">
          {instructors.map((teacher) => (
            <article key={teacher.slug} className="rounded-lg border border-sand bg-white p-5">
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
                  <Image src={teacher.photo} alt={teacher.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-terra">{teacher.title}</p>
                  <h2 className="mt-2 text-2xl font-bold text-warm-dark">{teacher.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-leaf">{teacher.credential} · {teacher.experience}</p>
                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-ink-soft">{teacher.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {teacher.specializations.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warm-mid">{item}</span>
                    ))}
                  </div>
                  <Link href={`/en/instructors/${teacher.slug}`} className="mt-5 inline-flex text-sm font-bold uppercase tracking-wide text-terra">
                    Read full bio
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
