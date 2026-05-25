"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { ArrowRight, Quote, Star, Video } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getPageCopy } from "@/lib/page-i18n";

const heroImage =
  "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-in-bali-1.jpg";

const featureStories = [
  {
    name: "Silvia",
    course: "200-hour graduate",
    image: heroImage,
    headline: "A deep and well-structured yoga journey",
    quote:
      "Silvia shared that the training built week by week and helped her understand asana, philosophy, anatomy and teaching in a grounded way.",
  },
  {
    name: "Emily",
    course: "Yoga teacher training student",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:370/h:370/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/yoga-teacher-training-student-emily.jpg",
    headline: "Supportive teachers and a memorable experience",
    quote:
      "Emily described the course as an incredible yoga journey and recommended it for students who want to teach or deepen their practice.",
  },
  {
    name: "Eva",
    course: "200-hour graduate",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Eva-200-hour-Review.jpg",
    headline: "Physical strength, mental peace and confidence",
    quote:
      "Eva called the 21-day training one of the most valuable experiences of her life, combining strength, flexibility and inner calm.",
  },
  {
    name: "Sam Menzies",
    course: "200-hour YTT in Bali",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:410/h:410/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Sam-200-HOUR-YTT-IN-BALI.jpg",
    headline: "Clear teaching methods in a beautiful setting",
    quote:
      "Sam highlighted Vivek's teaching style, the depth of knowledge, and the peaceful studio environment surrounded by nature.",
  },
];

const googleReviews = [
  {
    name: "Rowena Valenzuela",
    summary:
      "A transformative 200-hour training in Ubud with strong community, self-discovery and supportive guidance.",
  },
  {
    name: "Celine",
    summary:
      "A calm, clean and well-maintained learning space with supportive teachers and kind staff.",
  },
  {
    name: "Daniela Correa",
    summary:
      "An incredible experience with a caring team, strong support and a genuine passion for yoga education.",
  },
  {
    name: "Julia Huber",
    summary:
      "A 200-hour training that went beyond asana and helped her understand yoga more deeply.",
  },
  {
    name: "Alina Nurmist",
    summary:
      "A 100-hour course with interesting study days, special activities and attentive teaching.",
  },
  {
    name: "Sandra Barbosa",
    summary:
      "A high-value training with skilled teachers, meaningful excursions and nourishing meals.",
  },
  {
    name: "Sofija Popova",
    summary:
      "A strong foundation for teaching with philosophy, methodology and full immersion in yoga practice.",
  },
  {
    name: "Pit Khamnasak",
    summary:
      "A life-changing experience recommended for anyone starting or deepening a yoga and meditation journey.",
  },
];

export type PublicTestimonial = {
  id: string;
  name: string;
  course: string;
  quote: string;
  rating: number;
  location: string | null;
  graduationYear: number | null;
};

const videoStories = [
  {
    title: "Laura Review",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:auto/h:auto/q:mauto/g:sm/f:best///baliyttc.com/wp-content/uploads/2025/08/Laura-Review-Yoga-Teacher-Training-in-Bali-1.jpg",
  },
  {
    title: "Bali YTTC Review",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:auto/h:auto/q:mauto/g:sm/f:best///baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-Review-of-Bali-YTTC.jpg",
  },
  {
    title: "Student Review",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:auto/h:auto/q:mauto/g:sm/f:best///baliyttc.com/wp-content/uploads/2025/08/yoga-teacher-training-bali-testimnonial-1.jpg",
  },
  {
    title: "Training Student Story",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:auto/h:auto/q:mauto/g:sm/f:best///baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-Student-Review.jpg",
  },
];

export default function TestimonialsPage({ initialTestimonials = [] }: { initialTestimonials?: PublicTestimonial[] }) {
  const locale = useLocale();
  const copy = getPageCopy(locale, "pageHero");
  const publicReviews =
    initialTestimonials.length > 0
      ? initialTestimonials.map((item) => ({
          name: item.name,
          course: item.course,
          rating: item.rating,
          location: item.location,
          graduationYear: item.graduationYear,
          summary: item.quote,
        }))
      : googleReviews.map((item) => ({ ...item, course: null, rating: 5, location: null, graduationYear: null }));

  return (
    <main className="min-h-screen bg-cream">
      <section className="relative overflow-hidden bg-warm-dark pt-36 pb-20 text-white md:pt-44 md:pb-28">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Bali YTTC graduate" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/45" />
        </div>
        <div className="container-wide relative">
          <Reveal>
            <p className="label-caps mb-5 text-brand-light">{copy.testimonialsEyebrow}</p>
            <h1 className="display-xl max-w-4xl">
              {copy.testimonialsTitle}
            </h1>
            <p className="body-lg mt-6 max-w-2xl text-white/80">
              {copy.testimonialsIntro}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ApplyModal trigger={<Button className="btn-primary h-12 px-8">{copy.testimonialsPrimary}</Button>} />
              <Link href="/videos" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                {copy.testimonialsSecondary} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow="Featured Stories"
              title={<>Student <em className="text-terra">Experiences</em></>}
              sub="A curated set of student stories from the Bali YTTC testimonial page, rewritten into concise review cards for easier reading."
            />
          </Reveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {featureStories.map((story, index) => (
              <Reveal key={story.name} delay={index * 0.08}>
                <motion.article
                  whileHover={{ y: -6 }}
                  className="grid overflow-hidden rounded-3xl border border-warm-light/40 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr]"
                >
                  <img src={story.image} alt={story.name} className="h-64 w-full object-cover md:h-full" />
                  <div className="flex flex-col p-6">
                    <div className="mb-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <Quote className="mb-4 h-8 w-8 text-terra/30" />
                    <h2 className="display-sm text-warm-dark">{story.headline}</h2>
                    <p className="mt-4 flex-1 text-sm leading-7 text-warm-mid">{story.quote}</p>
                    <div className="mt-6 border-t border-warm-light/40 pt-4">
                      <p className="font-semibold text-warm-dark">{story.name}</p>
                      <p className="label-caps mt-1 text-terra">{story.course}</p>
                    </div>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-16">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow="Google Reviews"
              title={<>Verified review <em className="text-terra">highlights</em></>}
              sub="Approved student reviews from the Bali YTTC community."
            />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publicReviews.map((review, index) => (
              <Reveal key={review.name} delay={index * 0.04}>
                <article className="h-full rounded-2xl border border-warm-light/40 bg-cream p-5">
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-gold text-gold" : "text-warm-light"}`}
                      />
                    ))}
                  </div>
                  <p className="font-semibold text-warm-dark">{review.name}</p>
                  {(review.course || review.location || review.graduationYear) && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-terra">
                      {[review.course, review.location, review.graduationYear].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-7 text-warm-mid">{review.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow="Video Stories"
              title={<>Student review <em className="text-terra">videos</em></>}
              sub="Video cover stories from the reference testimonial page. Full video library is available in the Experience menu."
            />
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {videoStories.map((story, index) => (
              <Reveal key={story.title} delay={index * 0.06}>
                <Link href="/videos" className="group block overflow-hidden rounded-2xl bg-warm-dark shadow-sm">
                  <div className="relative aspect-[4/5]">
                    <img src={story.image} alt={story.title} className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                        <Video className="h-5 w-5" />
                      </span>
                      <p className="display-sm">{story.title}</p>
                      <p className="mt-2 text-sm text-white/75">Open video library</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-terra to-terra-deep py-16 text-white">
        <div className="container-wide text-center">
          <Reveal>
            <p className="label-caps mb-4 text-white/70">Join 2,500+ success stories</p>
            <h2 className="display-lg">Transform your practice with Bali YTTC</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Choose 50hr, 100hr, 200hr or 300hr training and start your own student story in Ubud.
            </p>
            <div className="mt-8">
              <ApplyModal trigger={<Button className="h-12 rounded-full bg-white px-8 text-terra hover:bg-white/90">Apply for 2026 Batch</Button>} />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
