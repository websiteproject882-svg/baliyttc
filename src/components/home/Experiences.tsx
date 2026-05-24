"use client";

import { EXPERIENCES } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";

const icons = ["01", "02", "03", "04", "05", "06"];
const activityLinks = [
  "holy-temple-purification",
  "arm-balancing-workshop",
  "sound-healing",
  "acro-yoga-workshop",
  "beach-yoga",
  "mandala-painting",
];

export const Experiences = () => {
  const copy = useHomeCopy();
  const experiences = EXPERIENCES.map((item, index) => ({ ...item, ...copy.experiences.cards[index] }));
  const marqueeExperiences = [...experiences, ...experiences];

  return (
    <section id="experiences" className="overflow-hidden bg-gradient-to-b from-warm-dark/5 to-sand py-10 md:py-14">
      <div className="container-edit">
        <Reveal>
          <div className="max-w-3xl">
            <p className="label-caps text-sage">{copy.experiences.eyebrow}</p>
            <h2 className="display-lg mt-3 text-charcoal">
              {copy.experiences.title} <em className="text-amber-600">{copy.experiences.accent}</em>
            </h2>
            <p className="body-lg mt-4 max-w-2xl text-ink-soft">{copy.experiences.subtitle}</p>
          </div>
        </Reveal>
      </div>

      <div className="relative mt-9 md:mt-11">
        <div className="flex w-max animate-marquee gap-4 px-5 [animation-duration:42s] hover:[animation-play-state:paused] md:gap-5 md:px-8">
          {marqueeExperiences.map((experience, index) => (
              <motion.div
                key={`${experience.title}-${index}`}
                whileHover={{ y: -8 }}
                className="w-[260px] shrink-0 md:w-[320px]"
              >
                <Link
                  href={`/activities#${activityLinks[index % experiences.length]}`}
                  aria-label={`View details for ${experience.title}`}
                  className="block"
                >
                <article className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-2xl md:aspect-[5/4]">
                  <img src={experience.img} alt={experience.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 transition-all duration-500 group-hover:via-black/55" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % experiences.length) * 0.04 }}
                    className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-cream group-hover:pointer-events-auto md:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xs font-bold tracking-[0.12em] drop-shadow-lg backdrop-blur md:h-11 md:w-11">
                        {icons[index % experiences.length] || "07"}
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
                        <Eye size={12} />
                        <span>{copy.common.view}</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/35 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-[2px] md:p-4">
                      <h3 className="font-serif text-xl font-semibold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transition-colors group-hover:text-amber-100 md:text-2xl">
                        {experience.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] md:text-sm">{experience.desc}</p>
                    </div>
                  </motion.div>
                </article>
                </Link>
              </motion.div>
          ))}
        </div>
      </div>

      <div className="container-edit">
        <Reveal>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 text-center md:hidden">
            <p className="mb-4 text-sm text-warm-dark">{copy.experiences.mobileHint}</p>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
};
