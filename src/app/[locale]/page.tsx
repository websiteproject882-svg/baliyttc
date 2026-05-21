"use client";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { Manifesto } from "@/components/home/Manifesto";
import { Pillars } from "@/components/home/Pillars";
import { VideoShowcase } from "@/components/home/VideoShowcase";
import { Teachers } from "@/components/home/Teachers";
import { Experiences } from "@/components/home/Experiences";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQ } from "@/components/home/FAQ";
import { FinalCTA } from "@/components/home/FinalCTA";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export default function HomePage() {
  return (
    <NextLayoutWrapper>
      <Hero />
      <TrustStrip />
      <FeaturedCourses />
      <Manifesto />
      <Pillars />
      <VideoShowcase />
      <Teachers />
      <Experiences />
      <GalleryTeaser />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </NextLayoutWrapper>
  );
}
