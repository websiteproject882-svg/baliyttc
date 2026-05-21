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

const Index = () => (
  <>
    {/* 1. First impression — full screen video hero */}
    <Hero />
    {/* 2. Trust proof immediately after hero */}
    <TrustStrip />
    {/* 3. Core product — courses with pricing */}
    <FeaturedCourses />
    {/* 4. School story & philosophy */}
    <Manifesto />
    {/* 5. Curriculum depth */}
    <Pillars />
    {/* 6. Campus tour video */}
    <VideoShowcase />
    {/* 7. Meet the teachers */}
    <Teachers />
    {/* 8. Upcoming batch dates — urgency/conversion */}
    {/* 9. Beyond the mat — extra experiences */}
    <Experiences />
    {/* 10. Visual proof — gallery */}
    <GalleryTeaser />
    {/* 11. Social proof — testimonials */}
    <Testimonials />
    {/* 12. Questions answered */}
    <FAQ />
    {/* 13. Final conversion push */}
    <FinalCTA />
  </>
);

export default Index;
