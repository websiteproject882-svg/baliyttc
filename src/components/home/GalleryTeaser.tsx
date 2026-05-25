"use client";
import { HOME_GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, Camera, Eye, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHomeCopy } from "@/lib/use-home-copy";
import { useEffect, useMemo, useState } from "react";

type PublicGalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

const fallbackHomeGalleryLabels = [
  "Opening ceremony",
  "Yoga class in the shala",
  "Temple purification",
  "Arm balancing workshop",
  "Sound healing session",
  "Acro yoga practice",
  "Beach yoga at sunrise",
  "Mandala meditation art",
  "Lead teacher Vivek Kalura",
  "Senior teacher Sachin Rautela",
];

function cleanGalleryLabel(label: string | null | undefined, index: number) {
  const fallback = fallbackHomeGalleryLabels[index % fallbackHomeGalleryLabels.length] || `Training moment ${index + 1}`;
  if (!label) return fallback;
  if (/^bali yttc gallery \d+$/i.test(label.trim())) return fallback;
  return label;
}

export const GalleryTeaser = () => {
  const copy = useHomeCopy();
  const galleryLabels = copy.common.galleryItems;
  const fallbackGallery = useMemo<PublicGalleryImage[]>(
    () =>
      HOME_GALLERY.map((url, index) => ({
        id: `static-home-gallery-${index}`,
        url,
        alt: cleanGalleryLabel(galleryLabels[index], index),
        caption: cleanGalleryLabel(galleryLabels[index], index),
      })),
    [galleryLabels],
  );
  const [galleryImages, setGalleryImages] = useState<PublicGalleryImage[]>(fallbackGallery);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const response = await fetch("/api/gallery?limit=12", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { images?: PublicGalleryImage[] };
        if (!cancelled && data.images?.length) {
          setGalleryImages(data.images);
        }
      } catch {
        // Keep static fallback when the admin-backed gallery is unavailable.
      }
    }

    setGalleryImages(fallbackGallery);
    loadGallery();

    return () => {
      cancelled = true;
    };
  }, [fallbackGallery]);

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

        <div className="relative px-4 md:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {galleryImages.slice(0, 6).map((image, i) => {
              const label = cleanGalleryLabel(image.caption || image.alt || galleryLabels[i % galleryLabels.length], i);
              
              // Custom responsive height/col mapping for asymmetric magazine look
              const getGridClasses = (idx: number) => {
                if (idx === 0) return "md:col-span-2 h-[260px] sm:h-[320px] md:h-[460px] md:rounded-[18px]";
                if (idx === 1) return "md:col-span-1 h-[260px] sm:h-[320px] md:h-[460px] md:rounded-[18px]";
                if (idx === 2) return "md:col-span-1 h-[240px] sm:h-[280px] md:h-[340px] md:rounded-[14px]";
                if (idx === 3) return "md:col-span-1 h-[240px] sm:h-[280px] md:h-[340px] md:rounded-[14px]";
                if (idx === 4) return "md:col-span-1 h-[240px] sm:h-[280px] md:h-[340px] md:rounded-[14px]";
                if (idx === 5) return "md:col-span-3 h-[260px] sm:h-[320px] md:h-[380px] md:rounded-[18px]";
                return "md:col-span-1 h-[240px] sm:h-[280px] md:h-[340px] md:rounded-[14px]";
              };

              return (
                <motion.div
                  key={`${image.id}-${i}`}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.4 }}
                  className={`group relative overflow-hidden rounded-[12px] bg-stone-100 shadow-[0_12px_28px_rgba(35,35,30,0.06)] hover:shadow-xl ${getGridClasses(i)}`}
                >
                  <Link href="/gallery" className="block h-full w-full">
                    <img
                      src={image.url}
                      alt={image.alt || label}
                      className="h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition group-hover:from-black/60 group-hover:to-black/75" />
                    
                    {/* Floating Corner Indicator Tag */}
                    <div className="absolute right-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/90 shadow-sm backdrop-blur-sm border border-white/10">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    <div className="absolute inset-x-5 bottom-5 text-white">
                      <div className="flex items-end justify-between gap-4">
                        <div className="max-w-[80%]">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                            YTT BALI LIFE
                          </p>
                          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-white md:text-xl">
                            {label}
                          </h3>
                        </div>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-charcoal opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110">
                          <Eye className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Staggered Expandable Grid */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 mt-5 pt-1">
                  {galleryImages.slice(6, 12).map((image, idx) => {
                    const i = idx + 6;
                    const label = cleanGalleryLabel(image.caption || image.alt || galleryLabels[i % galleryLabels.length], i);

                    return (
                      <motion.div
                        key={`${image.id}-${i}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.5 }}
                        whileHover={{ y: -6, scale: 1.01 }}
                        className="group relative h-[240px] sm:h-[280px] md:h-[340px] overflow-hidden rounded-[12px] md:rounded-[14px] bg-stone-100 shadow-[0_12px_28px_rgba(35,35,30,0.06)] hover:shadow-xl"
                      >
                        <Link href="/gallery" className="block h-full w-full">
                          <img
                            src={image.url}
                            alt={image.alt || label}
                            className="h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition group-hover:from-black/60 group-hover:to-black/75" />
                          
                          {/* Floating Corner Indicator Tag */}
                          <div className="absolute right-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/90 shadow-sm backdrop-blur-sm border border-white/10">
                            {String(i + 1).padStart(2, "0")}
                          </div>

                          <div className="absolute inset-x-5 bottom-5 text-white">
                            <div className="flex items-end justify-between gap-4">
                              <div className="max-w-[80%]">
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                                  CAMPUS MOMENT
                                </p>
                                <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-white md:text-xl">
                                  {label}
                                </h3>
                              </div>
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-charcoal opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110">
                                <Eye className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-8 py-3.5 text-sm font-semibold text-charcoal shadow-sm transition-all duration-300 hover:border-brand hover:text-brand"
            >
              <span>{expanded ? "Show Less" : "Show More"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
            </button>

            <Link
              href="/gallery"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-charcoal px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand"
            >
              {copy.common.viewGallery} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

