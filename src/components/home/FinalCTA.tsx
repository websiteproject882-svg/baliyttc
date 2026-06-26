"use client";

import { useState, useEffect } from "react";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { Link } from "@/i18n/routing";
import { useHomeCopy } from "@/lib/use-home-copy";
import { ArrowUpRight, CalendarDays, ShieldCheck, WalletCards } from "lucide-react";

const ctaHighlightsBase = [
  { icon: CalendarDays, label: "Upcoming", value: "Open soon" },
  { icon: WalletCards, label: "Booking", value: "Installments" },
  { icon: ShieldCheck, label: "Certified", value: "RYS school" },
];

export const FinalCTA = () => {
  const copy = useHomeCopy();
  const [highlightDate, setHighlightDate] = useState("July 2026");
  const [highlightSeats, setHighlightSeats] = useState("4 seats left");

  useEffect(() => {
    let active = true;
    async function fetchUpcoming() {
      try {
        const response = await fetch("/api/courses?locale=en");
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!active) return;
        
        let nextBatch: any = null;
        if (Array.isArray(data?.courses)) {
          for (const course of data.courses) {
            if (Array.isArray(course.batches)) {
              for (const batch of course.batches) {
                const batchDate = new Date(batch.startDate);
                if (batchDate >= new Date() && batch.status === "OPEN") {
                  if (!nextBatch || batchDate < new Date(nextBatch.startDate)) {
                    nextBatch = batch;
                  }
                }
              }
            }
          }
        }
        
        if (nextBatch) {
          const date = new Date(nextBatch.startDate);
          const dateLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const seatsLeft = Math.max(0, nextBatch.capacity - nextBatch.enrolled);
          const seatsLabel = seatsLeft <= 4 ? `Only ${seatsLeft} seats left` : `${seatsLeft} seats left`;
          setHighlightDate(dateLabel);
          setHighlightSeats(seatsLabel);
        }
      } catch {
        // Safe fallback
        setHighlightDate("July 2026");
        setHighlightSeats("4 seats left");
      }
    }
    void fetchUpcoming();
    return () => { active = false; };
  }, []);

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
                  {ctaHighlightsBase.map((item) => {
                    const Icon = item.icon;
                    const displayLabel = item.icon === CalendarDays ? highlightDate : item.label;
                    const displayValue = item.icon === CalendarDays ? highlightSeats : item.value;
                    return (
                      <div key={item.label} className="rounded-[8px] border border-white/20 bg-white/88 p-3 text-warm-dark shadow-sm backdrop-blur">
                        <Icon className="h-4 w-4 text-terra" />
                        <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-warm-mid">{displayLabel}</p>
                        <p className="mt-1 text-sm font-semibold leading-tight">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-h-[420px] flex-col justify-center px-6 py-8 sm:px-9 md:px-12 lg:min-h-[520px] lg:py-12">
                <p className="label-caps text-sage">{copy.finalCta.eyebrow}</p>
                <h2 className="mt-4 max-w-xl font-serif text-[2.35rem] font-light leading-[1.08] text-warm-dark sm:text-[3rem] lg:text-[4.25rem]">
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
