"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IMG } from "@/data/site";
import { useHomeCopy } from "@/lib/use-home-copy";

const pillarImages = [
  IMG.classMain,
  IMG.pranayama,
  IMG.certified,
  IMG.templePurification,
  IMG.graduation,
  IMG.course100,
  IMG.templePurification,
];

export const Pillars = () => {
  const copy = useHomeCopy();
  const pillars = copy.pillars;
  const [active, setActive] = useState(0);
  const current = pillars[active] || pillars[0];
  const currentTitle = current.title;

  return (
    <section id="pillars" className="bg-[#FAF9F6] py-10 md:py-14">
      <div className="container-edit">
        <div className="mx-auto mb-7 max-w-xl text-center">
          <p className="label-caps text-sage">
            Our Curriculum
          </p>
          <div className="mx-auto my-5 h-px w-16 bg-brand" />
          <h2 className="display-lg text-charcoal">
            The Seven <em className="font-serif italic text-brand">Pillars</em>
          </h2>
        </div>

        <div className="hidden gap-7 lg:grid lg:grid-cols-[0.42fr_0.58fr]">
          <div className="flex flex-col gap-2.5">
            {pillars.map((pillar, index) => {
              const isActive = index === active;
              return (
                <button
                  key={pillar.title}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`flex items-center gap-5 rounded-lg border px-5 py-4 text-left transition-all duration-300 ${
                    isActive
                      ? "translate-x-1.5 border-sage bg-[#FAF9F6] shadow-[0_16px_45px_rgba(33,30,26,0.08)]"
                      : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-300"
                  }`}
                >
                  <span className={`number-value text-lg ${isActive ? "text-brand" : "text-stone-400"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`flex-1 font-serif text-lg ${isActive ? "font-semibold text-charcoal" : "font-normal text-charcoal"}`}>
                    {pillar.title}
                  </span>
                  <span className={`text-sm transition-all duration-300 ${isActive ? "translate-x-1 text-brand" : "text-stone-300"}`}>
                    *
                  </span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_16px_50px_rgba(33,30,26,0.08)]"
          >
            <div className="relative h-[220px] overflow-hidden bg-[#FAF9F6]">
              <img
                src={pillarImages[active] || IMG.classMain}
                alt={currentTitle}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-6 font-serif text-2xl font-semibold text-white drop-shadow-lg">
                {String(active + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-7">
              <h3 className="display-sm mb-3 text-charcoal">{currentTitle}</h3>
              <p className="mb-5 text-[15px] leading-relaxed text-stone-600">{current.desc}</p>
              <div className="flex flex-col gap-2">
                {(current.points || []).map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">✓</span>
                    <span className="text-sm leading-6 text-charcoal">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_55px_rgba(33,30,26,0.08)]">
            {pillars.map((pillar, index) => {
              const isActive = index === active;
              const title = pillar.title;

              return (
                <div key={pillar.title} className="border-b border-stone-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
                      isActive ? "bg-[#FAF9F6]" : "bg-white hover:bg-stone-50"
                    }`}
                    aria-expanded={isActive}
                  >
                    <span className={`number-value text-lg ${isActive ? "text-brand" : "text-stone-400"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`flex-1 font-serif text-lg leading-tight ${isActive ? "text-charcoal" : "text-ink-soft"}`}>
                      {title}
                    </span>
                    <span className={`text-xl leading-none transition-transform ${isActive ? "rotate-45 text-brand" : "text-stone-400"}`}>
                      +
                    </span>
                  </button>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden bg-[#FAF9F6]"
                    >
                      <div className="px-5 pb-5">
                        <div className="relative h-44 overflow-hidden rounded-xl">
                          <img
                            src={pillarImages[index] || IMG.classMain}
                            alt={title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                        </div>

                        <h4 className="display-sm mt-4 text-charcoal">{title}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">{pillar.desc}</p>

                        <div className="mt-4 grid gap-2">
                          {(pillar.points || []).map((point) => (
                            <div key={point} className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">✓</span>
                              <span className="text-sm leading-5 text-charcoal">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pillars;
