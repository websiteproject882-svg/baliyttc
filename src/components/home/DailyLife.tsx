"use client";
import { DAILY_LIFE } from "@/data/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { motion } from "framer-motion";

export const DailyLife = () => (
  <section id="daily-life" className="relative overflow-hidden border-y border-stone-100 bg-white py-12 md:py-16">
    <div className="container-edit relative z-10 mb-8 md:mb-10">
      <SectionHeading
        eyebrow="A day in training"
        title={
          <>
            From Sunrise Meditation to
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Evening Kirtan
            </span>
          </>
        }
        sub="A steady rhythm of practice, study, mindfulness, and ceremony through each training day."
      />
    </div>

    <div className="container-wide relative z-10">
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 [scrollbar-width:none] md:gap-5 md:px-0 md:mx-0 [&::-webkit-scrollbar]:hidden">
        {DAILY_LIFE.map((d, i) => (
          <Reveal key={d.title} delay={i * 0.05}>
            <motion.article
              whileHover={{ y: -6 }}
              className="group w-[265px] shrink-0 snap-start cursor-pointer md:w-[320px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-stone-200 shadow-[0_12px_28px_rgba(35,35,30,0.08)] transition-all duration-500 hover:shadow-[0_18px_40px_rgba(35,35,30,0.13)]">
                <img
                  src={d.img}
                  alt={d.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/25 to-black/5" />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-charcoal shadow-sm backdrop-blur"
                >
                  {d.time}
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="display-sm mb-2">{d.title}</h3>
                  <p className="line-clamp-3 text-sm font-medium leading-relaxed text-white/86">{d.desc}</p>
                </div>
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 md:hidden">
        <span>Swipe to explore</span>
      </div>
    </div>
  </section>
);

