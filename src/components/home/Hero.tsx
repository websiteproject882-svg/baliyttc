"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Link } from "@/i18n/routing";

export const Hero = () => {
  const t = useTranslations("Hero");
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  // Skip to 7 seconds when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.currentTime < 7) {
        video.currentTime = 7;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Also try to skip after a short delay
    const timeout = setTimeout(() => {
      if (video.currentTime < 7) {
        video.currentTime = 7;
      }
    }, 700);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          poster="/images/hero/bali-hero-bg.png"
        >
          <source src="/videos/hero-yoga-1080.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </motion.div>

      {/* Clean gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/35 via-charcoal/18 to-charcoal/75 md:from-charcoal/40 md:via-charcoal/20 md:to-charcoal/60" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/70 via-black/24 to-transparent md:hidden" />

      {/* Video content overlay - fades on scroll */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-36 pt-32 sm:px-8 md:min-h-screen md:px-12 md:pb-12 lg:px-16"
      >
        <div className="mx-auto w-full max-w-7xl">

          {/* Main Heading - Two Lines */}
          <div className="max-w-7xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="display-xl text-white"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="leading-[1.02]"
              >
                {t("titleLine1")}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="leading-[1.02]"
              >
                {t("titleLine2")}
              </motion.div>
            </motion.h1>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-7 flex w-full max-w-[310px] flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center md:mt-10"
            >
              <ApplyModal
                trigger={
                  <button className="btn-primary group h-12 w-full px-6 text-[0.72rem] sm:h-14 sm:w-auto sm:px-10 sm:text-[0.8125rem]">
                    {t("applyBatch")}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-7 sm:w-7" />
                  </button>
                }
              />
              <Link
                href="/courses/200hr"
                className="btn-outline group h-12 w-full border-white/35 bg-black/20 px-6 text-[0.72rem] text-white backdrop-blur-sm hover:bg-white hover:text-charcoal sm:h-14 sm:w-auto sm:px-10 sm:text-[0.8125rem]"
              >
                <Play className="h-5 w-5 fill-current sm:h-7 sm:w-7" />
                {t("explorePrograms")}
              </Link>
            </motion.div>
          </div>

        </div>
      </motion.div>

      {/* Floating Glass Trust Badging Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="absolute bottom-8 inset-x-6 z-20 mx-auto hidden max-w-5xl rounded-full border border-white/10 bg-white/5 px-8 py-3.5 backdrop-blur-md md:flex items-center justify-between gap-6"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/90">
            Yoga Alliance Accredited YTT
          </span>
        </div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/90">
            5/5 Star Student Reviews
          </span>
        </div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/90">
            Authentic Vedic Heritage
          </span>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
};
