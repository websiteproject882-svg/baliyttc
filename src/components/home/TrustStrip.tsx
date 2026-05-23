"use client";

import { Star } from "lucide-react";
import { IMG } from "@/data/site";
import { Link } from "@/i18n/routing";
import { useHomeCopy } from "@/lib/use-home-copy";
import { useSocialProof } from "@/lib/use-social-proof";

const authorityCards = [
  {
    title: "Yoga Alliance",
    subtitle: "RYS 200 Registry",
    image: IMG.rys200,
  },
  {
    title: "Yoga Alliance",
    subtitle: "RYS 300 Registry",
    image: IMG.yogaAlliance,
  },
  {
    title: "Trustpilot",
    subtitle: "4.9 / 5 - Excellent",
    icon: "star",
    tone: "text-emerald-500",
  },
  {
    title: "TripAdvisor",
    subtitle: "Travellers' Choice",
    image: IMG.tripadvisor,
  },
  {
    title: "Google Reviews",
    subtitle: "4.9 - 600+ Reviews",
    icon: "G",
    tone: "text-[#4285F4]",
  },
];

export const TrustStrip = () => {
  const copy = useHomeCopy();
  const { ratingLabel, reviewLabel } = useSocialProof();
  const cards = authorityCards.map((card) => {
    if (card.title === "Trustpilot") return { ...card, subtitle: `${ratingLabel} - Excellent` };
    if (card.title === "Google Reviews") return { ...card, subtitle: reviewLabel };
    return card;
  });
  const marqueeCards = [...cards, ...cards];

  return (
    <section id="trust" className="overflow-hidden border-y border-stone-200 bg-white py-5 md:py-6">
      <div className="container-edit">
        <div className="mb-4 text-center">
          <p className="label-caps text-ink-muted">
            {copy.trust.recognised}
          </p>
        </div>

        <div className="-mx-4 overflow-hidden px-4">
          <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused] md:gap-5">
            {marqueeCards.map((card, index) => (
              <div
                key={`${card.title}-${card.subtitle}-${index}`}
                className="flex min-h-[98px] w-[190px] shrink-0 flex-col items-center justify-center rounded-[10px] border border-stone-200 bg-[#fcfaf7] px-4 py-3 text-center shadow-[0_10px_24px_rgba(35,35,30,0.04)] transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_16px_34px_rgba(35,35,30,0.09)] md:min-h-[108px] md:w-[220px]"
              >
                <div className="mb-2 flex h-9 w-10 items-center justify-center">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="max-h-9 max-w-[86px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : card.icon === "G" ? (
                    <span className="number-value text-[#4285F4]">G</span>
                  ) : (
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${card.tone || "text-sage"}`}>
                      <Star className="h-8 w-8 fill-current" />
                    </span>
                  )}
                </div>
                <h3 className="display-sm text-charcoal">{card.title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink-soft md:text-sm">{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/yoga-alliance"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage transition-colors hover:text-brand"
          >
            {copy.trust.certificationMeaning}
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
