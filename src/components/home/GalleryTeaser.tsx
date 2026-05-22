"use client";
import { HOME_GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, Camera, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeCopy } from "@/lib/use-home-copy";

export const GalleryTeaser = () => {
  const copy = useHomeCopy();
  const featuredGallery = HOME_GALLERY.slice(0, 6);
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

        <div className="container-edit px-4 md:px-0">
          <div className="hidden grid-cols-12 grid-rows-[220px_220px] gap-4 lg:grid">
            {featuredGallery.map((src, index) => {
              const layout =
                index === 0
                  ? "col-span-5 row-span-2"
                  : index === 1
                    ? "col-span-4"
                    : index === 2
                      ? "col-span-3"
                      : index === 3
                        ? "col-span-3"
                        : index === 4
                          ? "col-span-4"
                          : "col-span-3";

              return (
                <motion.div
                  key={src}
                  whileHover={{ y: -6 }}
                  className={`group relative overflow-hidden rounded-[10px] bg-stone-100 shadow-[0_14px_34px_rgba(35,35,30,0.08)] ${layout}`}
                >
                  <Link href="/gallery" className="block h-full w-full">
                    <img
                      src={src}
                      alt={galleryLabels[index] || `Gallery ${index + 1}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition group-hover:opacity-95" />
                    <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 font-serif text-xl font-semibold leading-tight drop-shadow">
                          {galleryLabels[index]}
                        </h3>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-charcoal opacity-0 transition group-hover:opacity-100">
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            {featuredGallery.map((src, i) => (
              <motion.div
                key={src}
                whileHover={{ scale: 1.02 }}
                className="group relative h-[230px] w-[260px] shrink-0 snap-center cursor-pointer overflow-hidden rounded-[10px] shadow-lg transition-all duration-500 hover:shadow-2xl"
              >
                <Link href="/gallery" className="block h-full w-full">
                  <img
                    src={src}
                    alt={galleryLabels[i] || `Gallery ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-white">{galleryLabels[i]}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
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

