"use client";
import { COURSES } from "@/data/site";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const fallbackCourseImages: Record<string, string> = {
  "50hr": "/images/campus/yoga-studio-bali-yttc.jpg",
  "100hr": "/images/campus/yoga-studio-pool-drone.jpg",
  "200hr": "/images/campus/firefly-sanctuary.jpg",
  "300hr": "/images/balinese-temple-gateway.jpg",
};

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

type CourseLabels = {
  nextDates: string;
  residential: string;
  seatsLeft: string;
  openSeats: string;
  yogaTraining: string;
  trainingStyle: string;
  defaultHighlights: string[];
  mostPopular: string;
  mostAccessible: string;
  advancedTrack: string;
  shortCourse: string;
  openSeatsBadge: string;
  from: string;
  startsFrom: string;
  details: string;
  certificationTrack: string;
};

const formatBatchDate = (date: string | null | undefined, locale: string, labels: CourseLabels) => {
  if (!date) return labels.nextDates;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return labels.nextDates;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(parsed);
};

const normalizeApiCourse = (course: ApiCourse, index: number, locale: string, labels: CourseLabels): DisplayCourse => {
  const durationParts = course.duration.split("|").map((part) => part.trim()).filter(Boolean);
  const batch = course.batches?.[0];
  const highlights = course.modules?.map((module) => module.title).filter(Boolean).slice(0, 4) as string[] | undefined;

  return {
    slug: course.slug,
    title: course.name,
    duration: durationParts[0] || course.duration || labels.yogaTraining,
    days: durationParts[1] || labels.residential,
    next: formatBatchDate(batch?.startDate, locale, labels),
    seats: typeof batch?.seatsLeft === "number" ? `${batch.seatsLeft} ${labels.seatsLeft}` : labels.openSeats,
    style: labels.trainingStyle,
    image: course.image || fallbackCourseImages[course.slug] || fallbackCourseImages["200hr"],
    summary: course.summary,
    highlights: highlights?.length ? highlights : labels.defaultHighlights,
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

const getMobileBadge = (course: DisplayCourse, labels: CourseLabels) => {
  if (course.featured) return labels.mostPopular;
  if (course.slug.includes("100")) return labels.mostAccessible;
  if (course.slug.includes("300")) return labels.advancedTrack;
  if (course.slug.includes("50")) return labels.shortCourse;
  return labels.openSeatsBadge;
};

const getCompactTitle = (title: string) =>
  title
    .replace("Yoga Teacher Training", "YTT")
    .replace("Advanced Teacher Training", "Advanced YTT")
    .replace("Hatha-Vinyasa Yoga Teacher Training", "Hatha-Vinyasa YTT");

const CourseThumb = ({ course }: { course: DisplayCourse }) => {
  const [src, setSrc] = useState(course.image);

  return (
    <img
      src={src}
      alt={course.title}
      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      loading="lazy"
      decoding="async"
      onError={() => setSrc(fallbackCourseImages[course.slug] || fallbackCourseImages["200hr"])}
    />
  );
};

const MobileCourseCard = ({ course, labels }: { course: DisplayCourse; labels: CourseLabels }) => (
  <Link
    href={course.href}
    className="group flex w-[286px] shrink-0 snap-center flex-col rounded-[9px] border border-stone-200 bg-white p-4 shadow-[0_10px_24px_rgba(35,35,30,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(35,35,30,0.12)]"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="rounded-[3px] bg-sage px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
          {getMobileBadge(course, labels)}
        </span>
        <h3 className="mt-4 font-serif text-[1.25rem] leading-[1.14] text-charcoal">
          {getCompactTitle(course.title)}
        </h3>
      </div>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[8px] bg-stone-100">
        <CourseThumb course={course} />
      </div>
    </div>

    <div className="mt-4 flex min-h-[148px] flex-col">
      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
        <span className="rounded-full bg-sand px-3 py-1 text-sage">{course.days}</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-500">{course.duration}</span>
      </div>
      <p className="mt-4 line-clamp-3 text-xs leading-6 text-ink-soft">{course.summary}</p>

      <div className="mt-auto flex items-end justify-between border-t border-stone-100 pt-3">
        <div>
          <p className="price-label">{labels.from}</p>
          <p className="price-value mt-1 text-[1.25rem]">EUR {course.priceFrom}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage">
          {labels.details} <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  </Link>
);

const CourseCard = ({
  course,
  index,
  active,
  labels,
}: {
  course: DisplayCourse;
  index: number;
  active: boolean;
  labels: CourseLabels;
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
        className={`relative flex h-full min-h-[440px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_14px_34px_rgba(42,36,28,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(42,36,28,0.13)] ${course.featured || active ? "ring-1 ring-brand/80" : "ring-1 ring-stone-200"}`}
      >
        <div className="relative h-[184px] overflow-hidden bg-stone-200">
          <CourseThumb course={course} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/10" />
          <div className="absolute left-4 top-4">
            <span className="inline-flex rounded-[3px] bg-sage px-3 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-white shadow-sm">
              {getMobileBadge(course, labels)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="min-h-[88px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              {course.days}
            </p>
            <h3 className="mt-3 font-serif text-[1.25rem] font-semibold leading-[1.18] text-charcoal">
              {getCompactTitle(course.title)}
            </h3>
            <p className="mt-2 text-[13px] text-ink-soft">{course.duration} {labels.certificationTrack}</p>
          </div>

          <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-ink-soft">
            {course.summary}
          </p>

          <div className="mt-auto border-t border-stone-200 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="price-label">{labels.startsFrom}</p>
                <p className="price-value mt-1 text-[1.55rem]">
                  EUR {course.priceFrom.toLocaleString("en-US")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:text-brand-dark">
                {labels.details} <ArrowUpRight className="h-3.5 w-3.5" />
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
  const t = useTranslations("FeaturedCourses");
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
    () => {
      const labels: CourseLabels = {
        nextDates: t("nextDates"),
        residential: t("residential"),
        seatsLeft: t("seatsLeft"),
        openSeats: t("openSeats"),
        yogaTraining: t("yogaTraining"),
        trainingStyle: t("trainingStyle"),
        defaultHighlights: t.raw("defaultHighlights") as string[],
        mostPopular: t("mostPopular"),
        mostAccessible: t("mostAccessible"),
        advancedTrack: t("advancedTrack"),
        shortCourse: t("shortCourse"),
        openSeatsBadge: t("openSeatsBadge"),
        from: t("from"),
        startsFrom: t("startsFrom"),
        details: t("details"),
        certificationTrack: t("certificationTrack"),
      };

      return apiCourses?.length
        ? apiCourses.map((course, index) => normalizeApiCourse(course, index, locale, labels))
        : COURSES.map(normalizeStaticCourse);
    },
    [apiCourses, locale, t],
  );
  const labels: CourseLabels = {
    nextDates: t("nextDates"),
    residential: t("residential"),
    seatsLeft: t("seatsLeft"),
    openSeats: t("openSeats"),
    yogaTraining: t("yogaTraining"),
    trainingStyle: t("trainingStyle"),
    defaultHighlights: t.raw("defaultHighlights") as string[],
    mostPopular: t("mostPopular"),
    mostAccessible: t("mostAccessible"),
    advancedTrack: t("advancedTrack"),
    shortCourse: t("shortCourse"),
    openSeatsBadge: t("openSeatsBadge"),
    from: t("from"),
    startsFrom: t("startsFrom"),
    details: t("details"),
    certificationTrack: t("certificationTrack"),
  };

  const scrollMobileSlider = (direction: "prev" | "next") => {
    const node = mobileSliderRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "next" ? 300 : -300,
      behavior: "smooth",
    });
  };

  return (
    <section id="courses" className="relative overflow-hidden bg-[#f7f4ef] py-9 md:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gray-200" />

      <div className="container-edit relative z-10">
        <div className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="display-lg text-charcoal">
              {t("choosePath")}
            </h2>
            <div className="mt-5 flex items-center gap-4 xl:mt-0">
              <span className="h-px w-20 bg-sage xl:w-28" />
              <p className="label-caps text-sage">
                {t("professionalTracks")}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
              {t("viewAllPrograms")} <ArrowUpRight className="h-4 w-4" />
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
              <MobileCourseCard key={course.slug} course={course} labels={labels} />
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
              labels={labels}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-5 text-center md:hidden">
          <Link href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-sage"
          >
            {t("viewAllCourses")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
