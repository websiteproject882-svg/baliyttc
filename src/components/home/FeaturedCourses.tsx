"use client";
import { COURSES } from "@/data/site";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";

type ApiCourse = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  summary: string;
  priceFrom: number;
  image?: string | null;
  modules?: Array<{ title?: string | null }>;
  batches?: Array<{ startDate?: string | null; seatsLeft?: number | null }>;
};

type DisplayCourse = {
  slug: string;
  title: string;
  duration: string;
  days: string;
  next: string;
  seats: string;
  style: string;
  image: string;
  summary: string;
  highlights: string[];
  href: string;
  priceFrom: number;
  featured?: boolean;
};

const formatBatchDate = (date?: string | null, locale = "en") => {
  if (!date) return "Next dates";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Next dates";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(parsed);
};

const normalizeApiCourse = (course: ApiCourse, index: number, locale: string): DisplayCourse => {
  const durationParts = course.duration.split("|").map((part) => part.trim()).filter(Boolean);
  const batch = course.batches?.[0];
  const highlights = course.modules?.map((module) => module.title).filter(Boolean).slice(0, 4) as string[] | undefined;

  return {
    slug: course.slug,
    title: course.name,
    duration: durationParts[0] || course.duration || "Yoga Training",
    days: durationParts[1] || "Residential",
    next: formatBatchDate(batch?.startDate, locale),
    seats: typeof batch?.seatsLeft === "number" ? `${batch.seatsLeft} seats left` : "Open seats",
    style: "Yoga Teacher Training",
    image: course.image || "/images/course-200hr.webp",
    summary: course.summary,
    highlights: highlights?.length ? highlights : ["Yoga Alliance curriculum", "Daily guided practice", "Residential Bali experience"],
    href: `/courses/${course.slug}`,
    priceFrom: course.priceFrom,
    featured: course.slug.includes("200") || index === 1,
  };
};

const normalizeStaticCourse = (course: (typeof COURSES)[number]): DisplayCourse => ({
  slug: course.slug,
  title: course.title,
  duration: course.duration,
  days: course.days,
  next: course.next,
  seats: course.seats,
  style: course.style,
  image: course.image,
  summary: course.summary,
  highlights: course.highlights,
  href: course.href,
  priceFrom: course.priceFrom,
  featured: course.featured,
});

const getMobileBadge = (course: DisplayCourse) => {
  if (course.featured) return "Most Popular";
  if (course.slug.includes("100")) return "Most Accessible";
  if (course.slug.includes("300")) return "Advanced Track";
  if (course.slug.includes("50")) return "Short Course";
  return "Open Seats";
};

const getCompactTitle = (title: string) =>
  title
    .replace("Yoga Teacher Training", "YTT")
    .replace("Advanced Teacher Training", "Advanced YTT")
    .replace("Hatha-Vinyasa Yoga Teacher Training", "Hatha-Vinyasa YTT");

const MobileCourseCard = ({ course }: { course: DisplayCourse }) => (
  <Link
    href={course.href}
    className="group flex w-[276px] shrink-0 snap-center flex-col overflow-hidden rounded-[10px] border border-stone-200 bg-white shadow-[0_10px_26px_rgba(35,35,30,0.07)] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(35,35,30,0.12)]"
  >
    <div className="relative h-[154px] overflow-hidden">
      <img
        src={course.image}
        alt={course.title}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent" />
      <span className="absolute left-4 top-4 rounded-[3px] bg-sage px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
        {getMobileBadge(course)}
      </span>
    </div>

    <div className="flex min-h-[126px] flex-col p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage">{course.days}</p>
      <h3 className="mt-1 font-serif text-[1.16rem] leading-[1.18] text-charcoal">
        {getCompactTitle(course.title)}
      </h3>

      <div className="mt-auto flex items-end justify-between border-t border-stone-100 pt-3">
        <div>
          <p className="price-label">From</p>
          <p className="price-value mt-1 text-[1.25rem]">EUR {course.priceFrom}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage">
          Details <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  </Link>
);

const CourseCard = ({
  course,
  index,
  active,
}: {
  course: DisplayCourse;
  index: number;
  active: boolean;
}) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="group flex h-full flex-col"
    >
      <Link
        href={course.href}
        className={`relative flex h-full min-h-[358px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_12px_28px_rgba(42,36,28,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(42,36,28,0.11)] ${course.featured || active ? "ring-1 ring-brand/70" : "ring-1 ring-stone-200"}`}
      >
        <div className="relative h-[174px] shrink-0 overflow-hidden xl:h-[184px]">
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          <span className="absolute left-4 top-4 rounded-[3px] bg-sage px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-white shadow-lg">
            {getMobileBadge(course)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{course.days}</p>
          <h3 className="mt-2 font-serif text-[1.22rem] font-semibold leading-[1.1] text-charcoal">
            {getCompactTitle(course.title)}
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-soft">{course.duration} certification track</p>
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-ink-soft">
            {course.summary}
          </p>

          <div className="mt-auto border-t border-stone-200 pt-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="price-label">Starts from</p>
                <p className="price-value mt-1">
                  EUR {course.priceFrom.toLocaleString("en-US")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:text-brand-dark">
                Details <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const FeaturedCourses = () => {
  const params = useParams<{ locale?: string }>();
  const locale = useLocale();
  const [apiCourses, setApiCourses] = useState<ApiCourse[] | null>(null);
  const mobileSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const locale = params?.locale || "en";

    fetch(`/api/courses?locale=${encodeURIComponent(locale)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.courses)) {
          setApiCourses(data.courses);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setApiCourses(null);
        }
      });

    return () => controller.abort();
  }, [params?.locale]);

  const courses = useMemo(
    () => (apiCourses?.length ? apiCourses.map((course, index) => normalizeApiCourse(course, index, locale)) : COURSES.map(normalizeStaticCourse)),
    [apiCourses, locale],
  );

  const scrollMobileSlider = (direction: "prev" | "next") => {
    const node = mobileSliderRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "next" ? 300 : -300,
      behavior: "smooth",
    });
  };

  return (
    <section id="courses" className="relative overflow-hidden bg-[#f7f4ef] py-7 md:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gray-200" />

      <div className="container-edit relative z-10">
        <div className="mb-5 flex flex-col gap-5 md:mb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="display-lg text-charcoal xl:hidden">
              Choose Your Path
            </h2>
            <div className="mt-5 flex items-center gap-4 xl:mt-0">
              <span className="h-px w-20 bg-sage xl:w-28" />
              <p className="label-caps text-sage">
                Professional Certification Tracks
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
              View All Programs <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => scrollMobileSlider("prev")}
            className="absolute left-0 top-[112px] z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-charcoal shadow-[0_10px_26px_rgba(35,35,30,0.16)] transition hover:border-sage hover:text-sage"
            aria-label="Previous courses"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            ref={mobileSliderRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-5 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {courses.map((course) => (
              <MobileCourseCard key={course.slug} course={course} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollMobileSlider("next")}
            className="absolute right-0 top-[112px] z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-charcoal shadow-[0_10px_26px_rgba(35,35,30,0.16)] transition hover:border-sage hover:text-sage"
            aria-label="Next courses"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
          {courses.map((course, index) => (
            <CourseCard
              key={course.slug}
              course={course}
              index={index}
              active={course.featured || index === 1}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-5 text-center md:hidden">
          <Link href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-sage"
          >
            View All Courses <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
