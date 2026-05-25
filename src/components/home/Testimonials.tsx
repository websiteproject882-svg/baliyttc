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
    <section id="testimonials" className="relative overflow-hidden bg-[#f7f4ef] py-12 md:py-16">
      <div className="container-edit relative z-10">
        {/* Section Header */}
        <div className="mb-8 grid gap-6 md:mb-10 md:grid-cols-[1fr_280px] md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <p className="label-caps mb-4 text-brand">{copy.testimonials.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display-lg text-charcoal">
                {copy.testimonials.title}{" "}
                <span className="text-brand">{copy.testimonials.accent}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft md:text-lg">
                {copy.testimonials.subtitle}
              </p>
            </Reveal>
          </div>

          {/* Rating Card */}
          <Reveal delay={0.1}>
            <div className="rounded-[10px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(35,35,30,0.07)]">
              <div className="mb-3 flex items-center gap-1 text-gold">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="number-value text-charcoal">{stats.averageRating.toFixed(1)}/5</p>
              <p className="price-label mt-2">
                {stats.totalApproved}+ {copy.testimonials.verified}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sage" />
                <span className="text-sm font-semibold text-sage">{copy.testimonials.topRated}</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Testimonial Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {featuredTestimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name + index} delay={index * 0.1}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group flex h-full min-h-[285px] flex-col rounded-[10px] border border-stone-200 bg-white p-5 shadow-[0_10px_26px_rgba(35,35,30,0.06)] transition-all duration-300 hover:border-brand/30 hover:shadow-[0_16px_34px_rgba(35,35,30,0.10)] md:p-6"
              >
                {/* Stars and Quote */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, n) => (
                      <Star key={n} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand">
                    Verified
                  </span>
                </div>

                {/* Quote */}
                <p className="flex-1 font-serif text-[1.08rem] font-normal italic leading-8 text-charcoal md:text-[1.18rem]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradients[index % 3]} text-sm font-bold text-white shadow-sm`}>
                    {testimonial.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-charcoal">{testimonial.name}</p>
                    <p className="label-caps mt-0.5 text-brand">
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
          className="mt-8 text-center md:mt-10"
        >
          <p className="mb-6 text-sm text-ink-muted">{copy.testimonials.readVerified}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ApplyModal trigger={
              <Button className="btn-primary h-12 px-8">
                {copy.testimonials.startJourney}
              </Button>
            } />
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-charcoal transition-all duration-300 hover:border-brand hover:text-brand"
            >
              {copy.testimonials.viewAll} <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
