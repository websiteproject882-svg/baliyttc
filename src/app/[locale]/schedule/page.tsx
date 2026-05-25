import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Euro, Users } from "lucide-react";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { scheduleCourses } from "@/data/marketing-pages";
import { getPageCopy } from "@/lib/page-i18n";

export default function SchedulePage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "en";
  const copy = getPageCopy(locale, "schedule");

  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-36 pb-16">
        <div className="container-edit">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{copy.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-warm-dark md:text-7xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
            {copy.intro}
          </p>
        </div>
      </section>

      <section className="bg-white pb-24 pt-4">
        <div className="container-edit space-y-8">
          {scheduleCourses.map((course) => (
            <article key={course.slug} className="rounded-lg border border-sand bg-cream/70 p-5 md:p-7">
              <div className="flex flex-col gap-4 border-b border-sand pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-warm-dark">{course.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-terra" />{course.duration}</span>
                    <span className="inline-flex items-center gap-2"><Euro className="h-4 w-4 text-terra" />{course.price}</span>
                  </div>
                </div>
                <Link href={`/${locale}/courses/${course.slug}`} className="text-sm font-bold uppercase tracking-wide text-terra">
                  {copy.viewDetails}
                </Link>
              </div>

              <div className="mt-5 divide-y divide-sand">
                {course.dates.map((date) => {
                  const fewSeats = date.status === "Few seats";
                  return (
                    <div key={`${course.slug}-${date.start}`} className="grid gap-4 py-5 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                      <div>
                        <p className="font-medium text-warm-dark">
                          {date.start} <span className="text-ink-soft">{copy.to}</span> {date.end}
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">{date.note}</p>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        fewSeats ? "bg-orange-100 text-orange-700" : "bg-leaf/10 text-leaf"
                      }`}>
                        {fewSeats ? <Users className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {fewSeats ? copy.fewSeats : copy.available}
                      </span>
                      <Link
                        href={`/${locale}/apply?course=${course.slug}&date=${encodeURIComponent(date.start)}`}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-terra px-5 text-sm font-semibold text-white hover:bg-terra-deep"
                      >
                        {copy.apply}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
