"use client";

import { ApplyModal } from "@/components/shared/ApplyModal";
import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { Link } from "@/i18n/routing";
import { useHomeCopy } from "@/lib/use-home-copy";
import { ArrowUpRight, CalendarDays, ShieldCheck, WalletCards } from "lucide-react";

const ctaHighlights = [
  { icon: CalendarDays, label: "June 2026", value: "4 seats left" },
  { icon: WalletCards, label: "Booking", value: "Installments" },
  { icon: ShieldCheck, label: "Certified", value: "RYS school" },
];

export const FinalCTA = () => {
  const copy = useHomeCopy();
  return (
    <section id="final-cta" className="bg-[#F7F4EF] px-4 py-10 md:py-16 scroll-mt-28">
      <div className="container-wide">
        <Reveal>
          <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white shadow-[0_22px_60px_rgba(35,35,30,0.10)]">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[260px] overflow-hidden bg-stone-200 lg:order-2 lg:min-h-[520px]">
                <img
                  src={IMG.graduation}
                  alt={copy.finalCta.imageAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-dark/65 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 sm:bottom-6 sm:left-6 sm:right-6">
                  {ctaHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-[8px] border border-white/20 bg-white/88 p-3 text-warm-dark shadow-sm backdrop-blur">
                        <Icon className="h-4 w-4 text-terra" />
                        <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-warm-mid">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold leading-tight">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-h-[420px] flex-col justify-center px-6 py-8 sm:px-9 md:px-12 lg:min-h-[520px] lg:py-12">
                <p className="label-caps text-sage">{copy.finalCta.eyebrow}</p>
                <h2 className="mt-4 max-w-xl font-sans text-[2.15rem] font-bold leading-[1.12] text-warm-dark sm:text-[2.65rem] lg:text-[3.45rem]">
                  {copy.finalCta.title} <em className="text-terra-light">{copy.finalCta.accent}</em>
                </h2>
                <p className="mt-5 max-w-xl text-[1rem] leading-8 text-warm-mid md:text-[1.08rem]">
                  {copy.finalCta.subtitle}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-8">
                  <ApplyModal
                    trigger={
                      <button className="inline-flex h-12 min-w-[190px] items-center justify-center rounded-full bg-terra px-7 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(238,92,43,0.18)] transition hover:bg-terra-deep">
                        {copy.finalCta.primary}
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </button>
                    }
                  />
                  <Link
                    href="/courses"
                    className="inline-flex h-12 min-w-[190px] items-center justify-center rounded-full border border-sage/35 bg-sage/5 px-7 text-sm font-semibold text-sage transition hover:border-sage hover:bg-sage hover:text-white"
                  >
                    {copy.finalCta.secondary}
                  </Link>
                </div>
                <div className="mt-7 grid gap-3 text-sm font-medium text-warm-mid sm:grid-cols-3">
                  {copy.finalCta.benefits.map((benefit) => (
                    <span key={benefit} className="rounded-full border border-stone-200 bg-cream px-4 py-2 text-center">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
