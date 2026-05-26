"use client";
import { COURSES, IMG } from "@/data/site";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Heart, Leaf, Users } from "lucide-react";
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

const cardCourseImages: Record<string, string> = {
  "50hr": IMG.yogaStudio,
  "100hr": IMG.classMain,
  "200hr": IMG.course200,
  "300hr": IMG.course300,
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
    image: cardCourseImages[course.slug] || course.image || fallbackCourseImages[course.slug] || fallbackCourseImages["200hr"],
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

const getCourseImage = (course: DisplayCourse) =>
  cardCourseImages[course.slug] || course.image || fallbackCourseImages[course.slug] || fallbackCourseImages["200hr"];

const CourseThumb = ({ course }: { course: DisplayCourse }) => {
  const [src, setSrc] = useState(getCourseImage(course));

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
    className="course-card-link group block shrink-0 w-[calc(100vw-48px)] max-w-[350px] overflow-hidden rounded-2xl bg-white border border-stone-200/60 shadow-[0_12px_36px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-lg"
  >
    <div>
      <div className="relative h-[200px] min-h-[200px] bg-stone-100 overflow-hidden">
        <CourseThumb course={course} />
        <span className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-wider text-white shadow-md ${course.featured ? "bg-brand/90" : "bg-sage/90"}`}>
          {getMobileBadge(course, labels)}
        </span>
      </div>
      <div className="p-6 flex flex-col justify-between gap-3">
        <div>
          <p className="label-caps text-[9px] font-bold text-brand uppercase mb-1">
            {course.days}
          </p>
          <h3 className="font-serif text-[1.25rem] font-medium text-gray-900 leading-snug mb-1">
            {getCompactTitle(course.title)}
          </h3>
          <p className="font-sans text-[12px] leading-relaxed text-gray-500">
            {course.duration} · {course.summary}
          </p>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-100">
          <span className="font-serif text-xl font-semibold text-brand">
            EUR {course.priceFrom.toLocaleString("en-US")}
          </span>
          <span className="font-sans text-xs font-bold text-brand flex items-center gap-1">
            {labels.details} →
          </span>
        </div>
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
        className="course-card-link block h-full overflow-hidden rounded-2xl bg-white border border-stone-200/60 shadow-[0_12px_36px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-stone-300"
      >
        <div>
          <div className="relative h-[200px] min-h-[200px] bg-stone-100 overflow-hidden">
            <CourseThumb course={course} />
            <span className={`absolute top-4 left-4 z-10 rounded-full px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white shadow-md ${course.featured ? "bg-brand/90" : "bg-sage/90"}`}>
              {getMobileBadge(course, labels)}
            </span>
          </div>
          <div className="p-6 flex flex-col justify-between h-[calc(100%-200px)] gap-4">
            <div>
              <p className="label-caps text-[10px] font-bold text-brand uppercase mb-1.5">
                {course.days}
              </p>
              <h3 className="font-serif text-[1.375rem] font-medium text-gray-900 leading-tight mb-2 group-hover:text-brand transition-colors duration-300">
                {getCompactTitle(course.title)}
              </h3>
              <p className="font-sans text-[13px] leading-relaxed text-gray-600 line-clamp-2">
                {course.duration} · {course.summary}
              </p>
            </div>
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-100">
              <span className="font-serif text-2xl font-semibold text-brand">
                EUR {course.priceFrom.toLocaleString("en-US")}
              </span>
              <span className="font-sans text-xs font-bold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                {labels.details} →
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

    fetch(`/api/courses?locale=${encodeURIComponent(locale)}`, { cache: "no-store", signal: controller.signal })
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
  const trustItems = [
    { icon: BadgeCheck, title: t("trustCertificationTitle"), text: t("trustCertificationText") },
    { icon: Users, title: t("trustTeachersTitle"), text: t("trustTeachersText") },
    { icon: Leaf, title: t("trustExperienceTitle"), text: t("trustExperienceText") },
    { icon: Heart, title: t("trustCommunityTitle"), text: t("trustCommunityText") },
  ];

  const scrollMobileSlider = (direction: "prev" | "next") => {
    const node = mobileSliderRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "next" ? 300 : -300,
      behavior: "smooth",
    });
  };

  return (
    <section id="courses" className="relative overflow-hidden bg-white py-10 md:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-stone-100" />

      <div className="container-edit relative z-10">
        <div className="mx-auto mb-8 max-w-4xl text-center md:mb-10">
          <h2 className="font-serif text-[2.45rem] font-semibold leading-tight tracking-tight text-charcoal md:text-[3.35rem]">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-soft md:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => scrollMobileSlider("prev")}
            className="absolute left-1 top-[112px] z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-charcoal shadow-[0_10px_26px_rgba(35,35,30,0.16)] transition hover:border-sage hover:text-sage"
            aria-label={t("previousCourses")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            ref={mobileSliderRef}
            className="-mx-4 flex snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain overscroll-y-auto scroll-smooth px-6 pb-6 pt-2 [scrollbar-width:none] [touch-action:pan-x_pan-y] [&::-webkit-scrollbar]:hidden"
          >
            {courses.map((course) => (
              <MobileCourseCard key={course.slug} course={course} labels={labels} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollMobileSlider("next")}
            className="absolute right-1 top-[112px] z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-charcoal shadow-[0_10px_26px_rgba(35,35,30,0.16)] transition hover:border-sage hover:text-sage"
            aria-label={t("nextCourses")}
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

        <div className="mt-9 hidden grid-cols-4 divide-x divide-stone-200 border-t border-stone-100 pt-7 md:grid">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-4 px-6 first:pl-0 last:pr-0">
              <item.icon className="h-9 w-9 shrink-0 text-sage" />
              <div>
                <p className="font-semibold text-charcoal">{item.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-5 text-center md:hidden">
          <Link href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-sage"
          >
            {t("viewAllCourses")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <style>{`
        .course-card-link {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .course-card-link:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 30px rgba(44, 74, 46, 0.12) !important;
          border-color: hsl(var(--brand)) !important;
        }
        .course-card-link:hover .details-arrow-text {
          padding-left: 6px;
        }
        .details-arrow-text {
          transition: padding-left 0.2s ease;
        }
      `}</style>
    </section>
  );
};
