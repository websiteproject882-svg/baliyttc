"use client";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { Play, Award, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

const videos = [
  {
    youtubeId: "TNzFh1N3GI0",
    poster: "https://img.youtube.com/vi/TNzFh1N3GI0/hqdefault.jpg",
    title: "Bali YTTC Yoga Teacher Training",
    category: "Training",
    duration: "YouTube",
    description: "A real look at Bali YTTC training, practice, teachers, and student life in Ubud.",
  },
  {
    youtubeId: "ZtGLDbj5wTs",
    poster: "https://img.youtube.com/vi/ZtGLDbj5wTs/hqdefault.jpg",
    title: "Bali Yoga Teacher Training Experience",
    category: "Student Life",
    duration: "YouTube",
    description: "Campus atmosphere, daily practice, and training moments from Bali Yoga Teacher Training Center.",
  },
  {
    youtubeId: "1MKgYxzERks",
    poster: "https://img.youtube.com/vi/1MKgYxzERks/hqdefault.jpg",
    title: "Yoga Teacher Training in Bali",
    category: "Campus",
    duration: "YouTube",
    description: "Explore the school environment, teaching space, and Bali YTTC learning experience.",
  },
  {
    youtubeId: "gMPL_lF6KF8",
    poster: "https://img.youtube.com/vi/gMPL_lF6KF8/hqdefault.jpg",
    title: "Bali YTTC Student Journey",
    category: "Ceremony",
    duration: "YouTube",
    description: "Student journey, ceremony moments, and the transformation around teacher training in Bali.",
  },
];

const videoCategories = [
  { name: "All Videos", count: videos.length },
  { name: "Training", count: 1 },
  { name: "Student Life", count: 1 },
  { name: "Campus", count: 1 },
  { name: "Ceremony", count: 1 },
];

export default function VideosPage() {
  return (
    <NextLayoutWrapper>
      <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 pt-40 text-white md:pb-24 md:pt-44">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600 rounded-full blur-[120px]" />
        </div>

        <div className="container-wide relative z-10">
          <Reveal>
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Reveal>
          <Reveal>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 mb-6">
                <Play className="h-5 w-5 text-orange-400" />
                <span className="label-caps text-orange-400">Video Gallery</span>
              </div>
              <h1 className="display-xl mb-6">
                Experience Bali YTTC
              </h1>
              <p className="body-lg text-gray-300">
                Watch videos from our campus, hear student stories, and see what makes our yoga teacher training unique.
              </p>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* Main Video */}
      <section className="py-16">
        <div className="container-wide">
          <Reveal>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] ring-1 ring-gray-900/5">
                <VideoPlayer
                  youtubeId={videos[0].youtubeId}
                  poster={videos[0].poster}
                  title={videos[0].title}
                  autoPlay={false}
                  muted={true}
                />
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="label-caps rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                    {videos[0].category}
                  </span>
                  <span className="text-sm text-gray-500">{videos[0].duration}</span>
                </div>
                <h2 className="display-md mb-3 text-gray-900">
                  {videos[0].title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {videos[0].description}
                </p>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* More Videos Grid */}
      <section className="pb-24">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow="Video Library"
              title="More Videos"
              sub="Explore our collection of videos showcasing campus life, student experiences, and training programs."
              align="left"
            />
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.slice(1).map((video, index) => (
              <Reveal key={video.youtubeId} delay={index * 0.1}>
                <motion.article
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video">
                      <VideoPlayer
                        youtubeId={video.youtubeId}
                        poster={video.poster}
                        title={video.title}
                        autoPlay={false}
                        muted={true}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="label-caps rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-700">
                        {video.category}
                      </span>
                      <span className="text-xs text-gray-400">{video.duration}</span>
                    </div>
                    <h3 className="display-sm text-gray-900 transition-colors group-hover:text-orange-600">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 py-20 text-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="display-lg mb-6">
              Ready to Create Your Own Story?
            </h2>
            <p className="text-lg text-orange-100 mb-8">
              Join thousands of yoga teachers who have transformed their practice at Bali YTTC. Your journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses/200hr"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-orange-600 shadow-lg transition-colors hover:bg-orange-50"
              >
                <Award className="h-5 w-5" />
                Apply for Training
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </NextLayoutWrapper>
  );
}
