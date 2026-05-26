"use client";

import { TESTIMONIALS as STATIC_TESTIMONIALS } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { ExternalLink, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";
import { useSocialProof } from "@/lib/use-social-proof";

type PublicTestimonial = {
  name: string;
  course: string;
  quote: string;
  rating: number;
};

const avatarGradients = ["from-brand to-brand-light", "from-sage to-sage-light", "from-gold to-gold-light"];

export const Testimonials = () => {
  const copy = useHomeCopy();
  const { stats: socialProofStats } = useSocialProof();
  const fallbackTestimonials = STATIC_TESTIMONIALS.map((item, index) => ({
    ...item,
    course: copy.testimonials.items[index]?.course || item.course,
    quote: copy.testimonials.items[index]?.quote || item.quote,
    rating: 5,
  }));
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>(fallbackTestimonials);
  const [stats, setStats] = useState({
    averageRating: socialProofStats.averageRating,
    totalApproved: socialProofStats.totalReviews,
  });

  useEffect(() => {
    setStats({
      averageRating: socialProofStats.averageRating,
      totalApproved: socialProofStats.totalReviews,
    });
  }, [socialProofStats.averageRating, socialProofStats.totalReviews]);

  useEffect(() => {
    void fetch("/api/testimonials?limit=6", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.testimonials) && result.testimonials.length > 0) {
          setTestimonials(result.testimonials);
        }
        if (result.stats) {
          setStats({
            averageRating: socialProofStats.averageRating || result.stats.averageRating || 4.9,
            totalApproved: socialProofStats.totalReviews || result.stats.totalApproved || 200,
          });
        }
      })
      .catch(console.error);
  }, [socialProofStats.averageRating, socialProofStats.totalReviews]);

  const featuredTestimonials = testimonials.slice(0, 3);

  return (
    <section id="testimonials" className="relative overflow-hidden border-b border-stone-200/50 bg-[#FAF9F6] py-16 md:py-24">
      <div className="container-edit relative z-10">
        {/* Section Header */}
        <div className="mb-8 grid gap-6 md:mb-10 md:grid-cols-[1fr_280px] md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <p className="label-caps mb-3 text-brand">{copy.testimonials.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display-lg text-gray-900">
                {copy.testimonials.title}{" "}
                <span className="font-serif italic text-brand">{copy.testimonials.accent}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
                {copy.testimonials.subtitle}
              </p>
            </Reveal>
          </div>

          {/* Rating Card */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.03)] text-left">
              <div className="mb-3 flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="font-serif text-3xl font-semibold text-gray-900 leading-none">{stats.averageRating.toFixed(1)}/5</p>
              <p className="label-caps mt-2 text-[10px] tracking-wider text-gray-500">
                {stats.totalApproved}+ {copy.testimonials.verified}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">{copy.testimonials.topRated}</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Testimonial Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {featuredTestimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name + index} delay={index * 0.1}>
              <motion.article
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.4 }}
                className="group flex h-full min-h-[285px] flex-col rounded-2xl border border-stone-200/60 bg-white p-6 shadow-[0_12px_36px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-stone-300 transition-all"
              >
                {/* Stars and Quote */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, n) => (
                      <Star key={n} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Verified
                  </span>
                </div>

                {/* Quote */}
                <p className="flex-1 font-serif text-[1.125rem] leading-[1.65] text-gray-800 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-5 flex items-center gap-3 border-t border-stone-100 pt-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradients[index % 3]} text-xs font-bold text-white shadow-sm`}>
                    {testimonial.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{testimonial.name}</p>
                    <p className="label-caps mt-0.5 text-[9px] font-semibold tracking-wider text-[#F04E23]">
                      {testimonial.course}
                    </p>
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center md:mt-12"
        >
          <p className="mb-6 text-sm text-gray-500">{copy.testimonials.readVerified}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ApplyModal trigger={
              <button className="btn-primary h-12 px-8">
                {copy.testimonials.startJourney}
              </button>
            } />
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-charcoal shadow-sm transition-all duration-300 hover:border-brand hover:text-brand"
            >
              {copy.testimonials.viewAll} <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
