"use client";
import { HOME_GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, Camera, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeCopy } from "@/lib/use-home-copy";

export const GalleryTeaser = () => {
  const copy = useHomeCopy();
  const marqueeGallery = [...HOME_GALLERY, ...HOME_GALLERY];
  const galleryLabels = copy.common.galleryItems;

  return (
    <section className="relative overflow-hidden bg-white py-10 md:py-16">
      <div className="container-wide relative z-10">
        <div className="container-edit mb-8 flex flex-col gap-5 px-4 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8 md:px-0">
          <div className="max-w-2xl">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-sage">
                  <Camera className="h-4 w-4" />
                </span>
                <p className="label-caps text-sage">{copy.common.galleryEyebrow}</p>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display-lg text-charcoal">
                {copy.common.galleryTitle}
                <br />
                <em className="font-serif italic text-brand">{copy.common.galleryAccent}</em>
              </h2>
            </Reveal>
          </div>
          <Link
            href="/gallery"
            className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-[0_10px_24px_rgba(35,35,30,0.06)] transition hover:border-brand hover:text-brand md:inline-flex"
          >
            {copy.common.viewGallery} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-28" />
          <div className="flex w-max animate-marquee-reverse gap-3 px-4 pb-3 [animation-duration:48s] hover:[animation-play-state:paused] md:gap-5 md:px-8">
            {marqueeGallery.map((src, i) => {
              const label = galleryLabels[i % galleryLabels.length] || `Gallery ${(i % HOME_GALLERY.length) + 1}`;

              return (
              <motion.div
                key={`${src}-${i}`}
                whileHover={{ scale: 1.02 }}
                className="group relative h-[170px] w-[205px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] bg-stone-100 shadow-[0_14px_34px_rgba(35,35,30,0.10)] transition-all duration-500 hover:shadow-2xl md:h-[230px] md:w-[300px] md:rounded-[12px]"
              >
                <Link href="/gallery" className="block h-full w-full">
                  <img
                    src={src}
                    alt={label}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition group-hover:from-black/45 group-hover:to-black/80" />
                  <div className="absolute inset-x-4 bottom-4 text-white md:inset-x-5 md:bottom-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                          {String((i % HOME_GALLERY.length) + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-white md:text-xl">
                          {label}
                        </h3>
                      </div>
                      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-charcoal opacity-0 transition group-hover:opacity-100 md:flex">
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-7 px-4 text-center md:hidden">
          <Link
            href="/gallery"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand"
          >
            {copy.common.viewGallery} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

