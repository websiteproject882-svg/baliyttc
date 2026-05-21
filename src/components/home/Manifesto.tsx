"use client";

import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";

const whyCards = [
  {
    eyebrow: "Graduation Day",
    title: "Yoga Alliance Certified",
    desc: "Fully accredited RYS 200 and 300 registry recognized worldwide for international teaching.",
    image: IMG.graduation,
  },
  {
    eyebrow: "Sanctuary Life",
    title: "All-Inclusive Ubud Sanctuary",
    desc: "Immersive stay, plant-based meals, daily practice space, and complete course materials.",
    image: IMG.classMain,
  },
  {
    eyebrow: "Lifetime Connection",
    title: "Global Alumni Community",
    desc: "Join an expansive network of graduates from 70+ countries practicing and teaching worldwide.",
    image: IMG.certified,
  },
  {
    eyebrow: "Practical Mastery",
    title: "Hands-on Teaching Practice",
    desc: "Graduate with real teaching experience, direct alignment feedback, and classroom confidence.",
    image: IMG.course100,
  },
  {
    eyebrow: "Sacred Culture",
    title: "Traditional Balinese Blessings",
    desc: "Take part in purification ceremonies, flower blessings, and temple-based cultural learning.",
    image: IMG.templePurification,
  },
  {
    eyebrow: "Ongoing Mentorship",
    title: "Lifetime Support & Mentorship",
    desc: "Access continuing guidance, teacher check-ins, school updates, and career direction after graduation.",
    image: IMG.pranayama,
  },
];

export const Manifesto = () => {
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
            <p className="label-caps text-sage">Why Choose Us</p>
            <div className="mx-auto my-5 h-px w-16 bg-brand" />
            <h2 className="display-lg text-charcoal">
              More Than a <em className="font-serif italic text-brand">Certification</em>
            </h2>
            <p className="body-lg mx-auto mt-5 max-w-xl">
              Bali YTTC is a sanctuary of deep learning. We merge authentic Vedic philosophy with modern alignment in Ubud's most healing environment.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-8 md:mt-10">
          <button
            type="button"
            onClick={() => scrollSlider("prev")}
            className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-charcoal shadow-[0_10px_28px_rgba(35,35,30,0.14)] transition hover:border-sage hover:text-sage md:inline-flex"
            aria-label="Scroll why choose us left"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div
            ref={sliderRef}
            className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-5 [scrollbar-width:none] md:gap-6 md:px-1 [&::-webkit-scrollbar]:hidden"
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
            aria-label="Scroll why choose us right"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
