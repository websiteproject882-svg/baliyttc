"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Reveal } from "@/components/shared/Reveal";
import { useHomeCopy } from "@/lib/use-home-copy";

const reviewVideos = [
  {
    name: "Bastian from Germany",
    course: "Yoga Teacher Training Review",
    quote: "A real student review from Bali YTTC's 200-hour yoga teacher training experience.",
    src: "/reviews/bastian-germany-ytt-review.mp4",
  },
  {
    name: "200-Hour YTT Testimonial",
    course: "Student Testimonial",
    quote: "Honest feedback from a graduate after completing the 200-hour Yoga Teacher Training at Bali YTTC.",
    src: "/reviews/testimonial-200-hour-ytt.mp4",
  },
  {
    name: "Student Review in Bali",
    course: "200-Hour Course Review",
    quote: "A short student review sharing the training atmosphere, learning journey, and Bali experience.",
    src: "/reviews/student-review-200-hour-bali.mp4",
  },
  {
    name: "Stephanie from Belgium",
    course: "Wonderful Journey Review",
    quote: "A graduate story from Belgium about the 200-hour Yoga Teacher Training journey in Bali.",
    src: "/reviews/stephanie-belgium-ytt-review.mp4",
  },
];

const CAMPUS_IMAGE = "/images/campus/firefly-sanctuary.jpg";

export const VideoShowcase = () => {
  const copy = useHomeCopy();
  const videos = reviewVideos.map((video, index) => ({ ...video, ...copy.video.reviews[index] }));
  const journalRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const scrollJournal = (direction: "prev" | "next") => {
    journalRef.current?.scrollBy({ left: direction === "next" ? 340 : -340, behavior: "smooth" });
  };

  const toggleVideo = (index: number) => {
    videoRefs.current.forEach((video, videoIndex) => {
      if (!video || videoIndex === index) return;
      video.pause();
      video.currentTime = 0;
      video.controls = false;
      video.muted = false;
    });

    const video = videoRefs.current[index];
    if (!video) return;

    if (playingIndex === index && !video.paused) {
      video.pause();
      setPlayingIndex(null);
      return;
    }

    video.controls = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    if (video.readyState < 2) {
      video.load();
    }
    video
      .play()
      .then(() => setPlayingIndex(index))
      .catch(() => {
        video.muted = true;
        video.controls = true;
        video
          .play()
          .then(() => setPlayingIndex(index))
          .catch(() => setPlayingIndex(null));
      });
  };

  return (
    <section id="campus-video" className="relative overflow-hidden border-b border-gray-100 bg-[#FAFAFA] py-10 md:py-12">
      <div className="container-wide relative z-10">
        <Reveal>
          <div className="mx-auto mb-7 max-w-3xl text-center md:mb-8">
            <div className="mb-6 inline-flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#F04E23]" />
              <p className="label-caps text-[#F04E23]">{copy.video.eyebrow}</p>
              <div className="h-2 w-2 rounded-full bg-[#F04E23]" />
            </div>
            <h2 className="display-lg mb-4 text-gray-900">
              {copy.video.title}
            </h2>
            <p className="body-lg text-gray-600">{copy.video.subtitle}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl bg-[#f4eee6] shadow-[0_14px_34px_-16px_rgba(0,0,0,0.18)] ring-1 ring-gray-900/5 md:mb-10"
          >
            <div className="relative aspect-[3/2] overflow-hidden">
              <img src={CAMPUS_IMAGE} alt={copy.video.campusAlt} className="h-full w-full object-contain" />
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="relative">
            <div className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="label-caps text-[#F04E23]">{copy.video.reviewEyebrow}</p>
                <h3 className="display-md mt-4 text-gray-900">
                  {copy.video.reviewTitle}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                  {copy.video.reviewSubtitle}
                </p>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <button
                  type="button"
                  onClick={() => scrollJournal("prev")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:border-[#F04E23] hover:text-[#F04E23]"
                  aria-label={copy.video.previousReview}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollJournal("next")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:border-[#F04E23] hover:text-[#F04E23]"
                  aria-label={copy.video.nextReview}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={journalRef}
              className="-mx-4 flex snap-x snap-proximity scroll-pl-4 gap-5 overflow-x-auto overscroll-y-auto px-4 pb-4 [scrollbar-width:none] [touch-action:pan-x_pan-y] md:gap-6 [&::-webkit-scrollbar]:hidden"
            >
              {videos.map((video, index) => {
                const isPlaying = playingIndex === index;

                return (
                  <article
                    key={video.src}
                    className="group flex w-[292px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-gray-900/5 transition hover:-translate-y-1 hover:shadow-xl md:w-[340px]"
                  >
                    <div className="relative h-[370px] overflow-hidden bg-gray-100 text-left md:h-[430px]">
                      <video
                        ref={(node) => {
                          videoRefs.current[index] = node;
                        }}
                        className="h-full w-full object-cover"
                        playsInline
                        autoPlay={false}
                        muted={false}
                        preload="auto"
                        controls={isPlaying}
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        onClick={() => {
                          if (isPlaying) {
                            toggleVideo(index);
                          }
                        }}
                        onPlay={() => setPlayingIndex(index)}
                        onPause={() => {
                          setPlayingIndex((current) => (current === index ? null : current));
                          const currentVideo = videoRefs.current[index];
                          if (currentVideo) currentVideo.controls = false;
                        }}
                        onEnded={() => setPlayingIndex((current) => (current === index ? null : current))}
                      >
                        <source src={video.src} type="video/mp4" />
                      </video>

                      {!isPlaying && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20" />
                          <button
                            type="button"
                            onClick={() => toggleVideo(index)}
                            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F04E23] text-white shadow-lg transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/40"
                            aria-label={`${copy.video.playReview}: ${video.name}`}
                          >
                            <Play className="ml-1 h-7 w-7 fill-current" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <p className="label-caps text-white/60">{video.course}</p>
                            <h4 className="display-sm mt-2 text-white">{video.name}</h4>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/75">{video.quote}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default VideoShowcase;
