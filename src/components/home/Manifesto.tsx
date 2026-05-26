"use client";

import { IMG } from "@/data/site";
import { useRef } from "react";
import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";

const whyImages = [IMG.graduation, IMG.classMain, IMG.certified, IMG.course100, IMG.templePurification, IMG.pranayama];

export const Manifesto = () => {
  const copy = useHomeCopy();
  const whyCards = copy.manifesto.cards.map((card, index) => ({
    ...card,
    image: whyImages[index] || IMG.classMain,
  }));
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "prev" | "next") => {
    const node = sliderRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "next" ? 382 : -382, // matches card width + gap
      behavior: "smooth",
    });
  };

  return (
    <section
      className="relative overflow-hidden border-b border-stone-200/50 bg-[#FAF9F6] py-16 md:py-24"
      id="why-us"
    >
      <div className="container-wide">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-16">
          <p className="label-caps text-gray-500">
            {copy.manifesto.eyebrow}
          </p>
          <div className="mx-auto my-4 h-px w-14 bg-stone-300" />
          <h2 className="display-lg text-gray-900 mb-4">
            {copy.manifesto.title}{" "}
            <em className="font-serif italic text-brand">
              {copy.manifesto.accent}
            </em>
          </h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-600">
            {copy.manifesto.description}
          </p>
        </div>

        {/* Card Slider */}
        <div className="relative">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollSlider("prev")}
            className="slider-side-arrow left-arrow absolute left-2 md:-left-4 top-[230px] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-gray-900 shadow-md transition-all duration-300 hover:bg-brand hover:text-white hover:border-brand hover:scale-105"
            aria-label="Scroll left"
          >
            ⟨
          </button>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollSlider("next")}
            className="slider-side-arrow right-arrow absolute right-2 md:-right-4 top-[230px] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-gray-900 shadow-md transition-all duration-300 hover:bg-brand hover:text-white hover:border-brand hover:scale-105"
            aria-label="Scroll right"
          >
            ⟩
          </button>

          {/* Slider list */}
          <div
            ref={sliderRef}
            id="why-us-slider"
            className="scroll-slider flex gap-8 overflow-x-auto pb-8 scroll-smooth"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {whyCards.map((card) => (
              <div
                key={card.title}
                className="why-card group flex w-[300px] sm:w-[350px] shrink-0 flex-col bg-transparent transition-transform duration-300"
              >
                <div className="why-img-container relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-stone-200/60 shadow-[0_12px_28px_rgba(0,0,0,0.04)]">
                  <img
                    alt={card.title}
                    src={card.image}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Subtle Shading Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="py-4 px-2">
                  <p className="label-caps text-[9px] font-bold tracking-widest text-brand uppercase mb-1.5">
                    {card.eyebrow}
                  </p>
                  <h4 className="font-serif text-lg font-medium text-gray-900 leading-snug mb-2 group-hover:text-brand transition-colors duration-300">
                    {card.title}
                  </h4>
                  <p className="font-sans text-[13px] leading-relaxed text-gray-500">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link
            className="btn-outline inline-flex items-center gap-2 rounded-full border-2 border-brand bg-transparent px-8 py-3 text-sm font-semibold text-brand transition-all duration-300 hover:bg-brand hover:text-white"
            href="/about"
          >
            Explore Our Story →
          </Link>
        </div>
      </div>

      <style>{`
        .why-card:hover {
          transform: translateY(-3px);
        }
        .why-card:hover img {
          transform: scale(1.04);
        }
        .slider-side-arrow:hover {
          background: hsl(var(--brand)) !important;
          color: #fff !important;
          border-color: hsl(var(--brand)) !important;
          transform: translateY(-50%) scale(1.05) !important;
        }
        
        .scroll-slider {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scroll-slider::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        @media (max-width: 767px) {
          .slider-side-arrow {
            width: 36px !important;
            height: 36px !important;
            font-size: 0.95rem !important;
          }
          .left-arrow {
            left: 8px !important;
          }
          .right-arrow {
            right: 8px !important;
          }
        }
      `}</style>
    </section>
  );
};
