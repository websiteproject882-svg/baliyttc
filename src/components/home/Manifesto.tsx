"use client";

import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useHomeCopy } from "@/lib/use-home-copy";

const whyImages = [IMG.graduation, IMG.classMain, IMG.certified, IMG.course100, IMG.templePurification, IMG.pranayama];

export const Manifesto = () => {
  const copy = useHomeCopy();
  const whyCards = copy.manifesto.cards.map((card, index) => ({ ...card, image: whyImages[index] || IMG.classMain }));
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "prev" | "next") => {
    const node = sliderRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "next" ? 310 : -310,
      behavior: "smooth",
    });
  };

  return (
    <section id="why-us" className="relative overflow-hidden border-y border-stone-200 bg-white py-8 md:py-10">
      <div className="container-edit">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-caps text-sage">{copy.manifesto.eyebrow}</p>
            <div className="mx-auto my-5 h-px w-16 bg-brand" />
            <h2 className="display-lg text-charcoal">
              {copy.manifesto.title} <em className="font-serif italic text-brand">{copy.manifesto.accent}</em>
            </h2>
            <p className="body-lg mx-auto mt-5 max-w-xl">{copy.manifesto.description}</p>
          </div>
        </Reveal>

        <div className="relative mt-8 md:mt-10">
          <button
            type="button"
            onClick={() => scrollSlider("prev")}
            className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-charcoal shadow-[0_10px_28px_rgba(35,35,30,0.14)] transition hover:border-sage hover:text-sage md:inline-flex"
            aria-label={copy.manifesto.previous}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div
            ref={sliderRef}
            className="-mx-4 flex snap-x snap-proximity gap-5 overflow-x-auto overscroll-y-auto scroll-smooth px-4 pb-5 [scrollbar-width:none] [touch-action:pan-x_pan-y] md:gap-6 md:px-1 [&::-webkit-scrollbar]:hidden"
          >
            {whyCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex h-[382px] w-[268px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(35,35,30,0.13)] md:h-[356px] md:w-[280px]"
              >
                <div className="relative h-[176px] shrink-0 overflow-hidden md:h-[168px]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
                  <span className="label-caps absolute left-4 top-4 rounded-[7px] bg-sage px-3 py-1.5 text-white shadow-lg">
                    {card.eyebrow}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 md:p-5">
                  <h3 className="display-sm text-charcoal">{card.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-ink-soft">{card.desc}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollSlider("next")}
            className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-charcoal shadow-[0_10px_28px_rgba(35,35,30,0.14)] transition hover:border-sage hover:text-sage md:inline-flex"
            aria-label={copy.manifesto.next}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
