"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { IMG } from "@/data/site";
import { useHomeCopy } from "@/lib/use-home-copy";

export const SanctuaryIntro = () => {
  const copy = useHomeCopy();

  return (
    <section className="relative overflow-hidden bg-[#f8f5ef] py-10 md:py-14">
      <div className="container-edit grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <Reveal>
          <div className="relative overflow-hidden rounded-[10px] bg-stone-200 shadow-[0_18px_45px_rgba(35,35,30,0.12)]">
            <img
              src={IMG.yogaStudio}
              alt={copy.intro.title}
              className="aspect-[4/3] h-full w-full object-cover lg:aspect-[5/4]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-charcoal/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2 rounded-[8px] bg-white/92 p-3 shadow-lg backdrop-blur">
              {copy.intro.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="number-value text-base leading-none text-charcoal md:text-lg">{stat.value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="max-w-2xl lg:pl-6">
            <p className="label-caps text-sage">{copy.intro.eyebrow}</p>
            <h2 className="mt-4 font-sans text-[2.1rem] font-bold leading-[1.14] text-charcoal md:text-[3rem] md:leading-[1.1]">
              {copy.intro.title}
            </h2>
            <p className="body-lg mt-5 text-charcoal">{copy.intro.subtitle}</p>
            <p className="mt-4 text-sm leading-7 text-ink-soft md:text-base md:leading-8">{copy.intro.body}</p>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-[0_10px_24px_rgba(35,35,30,0.06)] transition hover:border-brand hover:text-brand"
            >
              {copy.intro.cta} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
