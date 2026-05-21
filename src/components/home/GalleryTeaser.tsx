"use client";
import { HOME_GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { getHomeCopy } from "@/lib/home-localized";

export const GalleryTeaser = () => {
  const copy = getHomeCopy(useLocale());
  const marqueeGallery = [...HOME_GALLERY, ...HOME_GALLERY];

  return (
  <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-orange-50/30 py-10 md:py-14">
    <div className="container-wide relative z-10">
      {/* Header */}
      <div className="container-edit mb-8 flex flex-col gap-5 px-4 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8 md:px-0">
        <div className="max-w-xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p className="eyebrow text-amber-700 font-semibold">{copy.common.galleryEyebrow}</p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 
              className="display-lg text-gray-900"
            >
              {copy.common.galleryTitle}
              <br />
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {copy.common.galleryAccent}
              </span>
            </h2>
          </Reveal>
        </div>
        <Link href="/gallery" 
          className="hidden md:inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg"
        >
          {copy.common.viewGallery} <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Auto-moving gallery row */}
      <div className="relative">
        <div className="flex w-max animate-marquee-reverse gap-3 px-4 pb-3 [animation-duration:48s] hover:[animation-play-state:paused] md:gap-5 md:px-8">
          {marqueeGallery.map((src, i) => (
              <motion.div
                key={`${src}-${i}`}
                whileHover={{ scale: 1.02 }}
                className="group relative h-[170px] w-[205px] shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-lg transition-all duration-500 hover:shadow-2xl md:h-[230px] md:w-[300px] md:rounded-2xl"
              >
                <Link href="/gallery" className="block w-full h-full">
                  <img
                    src={src}
                    alt={`Gallery ${(i % 10) + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/60 group-hover:from-black/40 group-hover:to-black/80 transition-all duration-300" />

                  {/* Eye Icon - Shows on Hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full">
                      <Eye className="w-6 h-6 text-gray-900" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="mt-7 px-4 text-center md:hidden">
        <Link href="/gallery"
          className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg"
        >
          {copy.common.viewGallery} <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  </section>
  );
};

