"use client";

import { TESTIMONIALS as STATIC_TESTIMONIALS } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { ExternalLink, Quote, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";

type PublicTestimonial = {
  name: string;
  course: string;
  quote: string;
  rating: number;
};

const avatarGradients = ["from-brand to-brand-light", "from-sage to-sage-light", "from-gold to-gold-light"];

export const Testimonials = () => {
  const copy = useHomeCopy();
  const fallbackTestimonials = STATIC_TESTIMONIALS.map((item, index) => ({
    ...item,
    course: copy.testimonials.items[index]?.course || item.course,
    quote: copy.testimonials.items[index]?.quote || item.quote,
    rating: 5,
  }));
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>(fallbackTestimonials);
  const [stats, setStats] = useState({ averageRating: 4.9, totalApproved: 200 });

  useEffect(() => {
    void fetch("/api/testimonials?limit=6")
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.testimonials) && result.testimonials.length > 0) {
          setTestimonials(result.testimonials);
        }
        if (result.stats) {
          setStats({
            averageRating: result.stats.averageRating || 4.9,
            totalApproved: result.stats.totalApproved || 200,
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#f8f5ef] py-12 md:py-16">
      <div className="container-wide relative z-10">
        {/* Section Header */}
        <div className="mb-10 flex flex-col gap-8 md:mb-12 md:flex-row md:items-end md:justify-between lg:container-edit">
          <div>
            <Reveal>
              <p className="eyebrow mb-5">{copy.testimonials.eyebrow}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display-lg text-charcoal">
                {copy.testimonials.title}
                <br />
                <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">{copy.testimonials.accent}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-lg mt-4 max-w-xl">{copy.testimonials.subtitle}</p>
            </Reveal>
          </div>

          {/* Rating Card */}
          <Reveal delay={0.1}>
            <div className="shrink-0 rounded-[10px] border border-stone-200 bg-white p-6 shadow-[0_14px_34px_rgba(35,35,30,0.08)] md:p-7">
              <div className="mb-4 flex items-center justify-center gap-1 text-gold">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="number-value text-center text-charcoal">{stats.averageRating.toFixed(1)}/5</p>
              <p className="price-label mt-3 text-center">
                {stats.totalApproved}+ {copy.testimonials.verified}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-sage" />
                <span className="text-sm font-semibold text-sage">{copy.testimonials.topRated}</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Testimonial Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:container-edit lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name + index} delay={index * 0.1}>
              <motion.article
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group flex h-full flex-col rounded-[10px] border border-stone-200 bg-white p-6 shadow-[0_12px_28px_rgba(35,35,30,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_18px_42px_rgba(35,35,30,0.12)] md:p-7"
              >
                {/* Stars and Quote */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, n) => (
                      <Star key={n} className="h-5 w-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <Quote className="h-7 w-7 text-brand/25" />
                </div>

                {/* Quote */}
                <p className="flex-1 font-serif text-[1.08rem] font-normal italic leading-8 text-charcoal md:text-[1.18rem]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-8 flex items-center gap-4 border-t border-gray-100 pt-6">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradients[index % 3]} text-base font-bold text-white shadow-lg`}>
                    {testimonial.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-base font-medium text-charcoal">{testimonial.name}</p>
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
          className="mt-10 text-center md:mt-12 lg:container-edit"
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
