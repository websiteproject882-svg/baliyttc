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
  "50hr": IMG.certified,
  "100hr": IMG.classMain,
  "200hr": IMG.course200,
  "300hr": IMG.templePurification,
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
    className="group flex w-[calc(100vw-48px)] max-w-[350px] shrink-0 snap-center flex-col overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_12px_28px_rgba(22,33,37,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(22,33,37,0.13)]"
  >
    <div className="relative aspect-[1.42/1] min-h-[196px] overflow-hidden bg-stone-100">
      <CourseThumb course={course} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      <div className="absolute left-5 top-5">
        <span className="rounded-[5px] bg-sage px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-white shadow-sm">
          {getMobileBadge(course, labels)}
        </span>
      </div>
    </div>

    <div className="flex min-h-[382px] flex-col p-5">
      <div className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-sage">
        <CalendarDays className="h-4 w-4" />
        <span>{course.days}</span>
      </div>
      <h3 className="mt-5 font-sans text-[1.45rem] font-semibold leading-[1.18] tracking-tight text-charcoal">
        {getCompactTitle(course.title)}
      </h3>
      <p className="mt-3 text-[15px] leading-6 text-charcoal">{course.duration} {labels.certificationTrack}</p>
      <div className="my-5 h-px bg-stone-200" />
      <p className="line-clamp-5 text-[15px] leading-7 text-charcoal/85">{course.summary}</p>

      <div className="mt-auto border-t border-stone-200 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{labels.startsFrom}</p>
          <p className="mt-1 font-sans text-[1.6rem] font-semibold tracking-tight text-charcoal">
            EUR {course.priceFrom.toLocaleString("en-US")}
          </p>
        </div>
        <span className="mt-4 inline-flex h-12 w-full items-center justify-between rounded-[7px] border border-sage px-5 text-base font-semibold text-sage transition group-hover:bg-sage group-hover:text-white">
          {labels.details} <ArrowRight className="h-5 w-5" />
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
        className={`relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_14px_34px_rgba(22,33,37,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(22,33,37,0.14)] ${course.featured || active ? "ring-1 ring-brand/75" : "ring-1 ring-stone-200"}`}
      >
        <div className="relative h-[250px] overflow-hidden bg-stone-100">
          <CourseThumb course={course} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="inline-flex rounded-[5px] bg-sage px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] text-white shadow-sm">
              {getMobileBadge(course, labels)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.08em] text-sage">
            <CalendarDays className="h-5 w-5" />
            <span>{course.days}</span>
          </div>

          <div className="mt-7 min-h-[102px]">
            <h3 className="font-sans text-[1.55rem] font-semibold leading-[1.22] tracking-tight text-charcoal">
              {getCompactTitle(course.title)}
            </h3>
            <p className="mt-4 text-[15px] leading-6 text-charcoal">
              {course.duration} {labels.certificationTrack}
            </p>
          </div>

          <div className="my-6 h-px bg-stone-200" />

          <p className="line-clamp-5 text-[15px] leading-8 text-charcoal/85">
            {course.summary}
          </p>

          <div className="mt-auto border-t border-stone-200 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">{labels.startsFrom}</p>
              <p className="mt-2 font-sans text-[1.75rem] font-semibold tracking-tight text-charcoal">
                EUR {course.priceFrom.toLocaleString("en-US")}
              </p>
            </div>
            <span className="mt-5 inline-flex h-12 w-full items-center justify-between rounded-[7px] border border-sage px-5 text-base font-semibold text-sage transition group-hover:bg-sage group-hover:text-white">
              {labels.details} <ArrowRight className="h-5 w-5" />
            </span>
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
    <section id="courses" className="relative overflow-hidden bg-white py-12 md:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-stone-100" />

      <div className="container-edit relative z-10">
        <div className="mx-auto mb-10 max-w-4xl text-center md:mb-12">
          <h2 className="font-sans text-[2.45rem] font-semibold leading-tight tracking-tight text-charcoal md:text-[3.35rem]">
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
            aria-label="Previous courses"
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

        <div className="mt-9 hidden grid-cols-4 divide-x divide-stone-200 border-t border-stone-100 pt-7 md:grid">
          {[
            { icon: BadgeCheck, title: "Yoga Alliance Certified", text: "Globally recognized certification" },
            { icon: Users, title: "Experienced Teachers", text: "Learn from dedicated mentors" },
            { icon: Leaf, title: "Authentic Experience", text: "In the heart of Ubud, Bali" },
            { icon: Heart, title: "Supportive Community", text: "Grow with like-minded souls" },
          ].map((item) => (
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
    </section>
  );
};
