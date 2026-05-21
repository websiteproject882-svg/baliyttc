"use client";
import { Reveal } from "@/components/shared/Reveal";
import { IMG } from "@/data/site";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, CheckCircle2, Award } from "lucide-react";
import { motion } from "framer-motion";

const highlights = [
  "Small batches with individual feedback",
  "Traditional practice backed by practical anatomy",
  "Daily teaching practice before graduation",
];

const stats = [
  { num: "2,500+", label: "Graduates" },
  { num: "8 yrs", label: "Established" },
  { num: "RYS 200 & 300", label: "Yoga Alliance" },
];

export const Manifesto = () => (
  <section className="bg-white py-20 md:py-32 overflow-hidden">
    <div className="container-edit grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
      <div className="lg:col-span-7">
        <Reveal>
          <p className="eyebrow text-terra">About Bali YTTC</p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-3xl font-serif text-[clamp(1.9rem,4.5vw,3.5rem)] font-bold leading-[1.06] tracking-tight text-warm-dark">
            Serious yoga training,
            <br />
            <span className="text-terra">held in calm Bali.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-7 max-w-2xl space-y-4 text-base leading-8 text-ink-soft md:text-lg">
            <p>
              Bali YTTC is a Yoga Alliance registered school in Ubud. The programs combine asana,
              pranayama, meditation, anatomy, philosophy and teaching methodology in one structured
              residential experience.
            </p>
            <p>
              The goal is not just a certificate. Students leave with a stronger personal practice,
              clearer teaching language, and enough supervised practice to guide a real class with confidence.
            </p>
          </div>
        </Reveal>

        {/* Stats row */}
        <Reveal delay={0.12}>
          <div className="mt-8 flex gap-6 md:gap-10">
            {stats.map(s => (
              <div key={s.label}>
                <p className="font-serif text-2xl font-bold text-warm-dark md:text-3xl">{s.num}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-warm-light">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-warm-dark/10 bg-cream p-4 transition-all duration-300 hover:border-terra/30 hover:shadow-elev-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-terra" />
                <p className="text-sm font-medium leading-6 text-warm-mid">{item}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/about"
              className="inline-flex items-center gap-2 rounded-lg bg-warm-dark px-6 py-3 text-sm font-semibold text-cream transition-all duration-300 hover:bg-terra-deep hover:shadow-elev-md"
            >
              Read our story
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/instructors"
              className="inline-flex items-center gap-2 rounded-lg border border-warm-dark/15 bg-transparent px-6 py-3 text-sm font-semibold text-warm-dark transition-all duration-300 hover:bg-sand"
            >
              Meet the teachers
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Image column */}
      <div className="relative lg:col-span-5">
        <Reveal y={30}>
          <div className="overflow-hidden rounded-2xl bg-sand shadow-elev-lg">
            <img
              src={IMG.certified}
              alt="Certified yoga teacher training in Bali"
              className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Reveal>

        {/* Floating stat card */}
        <Reveal delay={0.18} y={18}>
          <motion.div
            whileHover={{ y: -4 }}
            className="absolute -bottom-6 left-4 right-4 rounded-xl border border-warm-dark/10 bg-cream p-5 shadow-elev-lg md:left-auto md:right-6 md:w-64"
          >
            <div className="flex items-center gap-3 mb-3">
              <Award className="h-5 w-5 text-terra" />
              <p className="text-xs uppercase tracking-[0.2em] text-warm-light font-semibold">Teaching experience</p>
            </div>
            <p className="font-serif text-4xl font-bold leading-none text-terra">15+</p>
            <p className="mt-2 text-sm leading-6 text-warm-mid">
              Years of combined experience across our lead faculty.
            </p>
          </motion.div>
        </Reveal>
      </div>
    </div>
  </section>
);
