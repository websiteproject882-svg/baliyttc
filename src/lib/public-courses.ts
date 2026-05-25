import { BATCHES, COURSES as STATIC_COURSES } from "@/data/site";
import type { Locale } from "@/i18n/routing";
import prisma from "@/lib/prisma";
import { applyCourseTranslation } from "@/lib/localized-content";
import { getCached, setCached } from "./runtime-cache";

type CourseWithTranslations<T extends Record<string, unknown>> = T & {
  translations?: unknown;
};

export type PublicCourse = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  summary: string;
  description?: string;
  priceFrom: number;
  priceFull?: number | null;
  image?: string | null;
  isActive?: boolean;
  modules?: unknown[];
  batches?: unknown[];
};

export function getStaticPublicCourses(): PublicCourse[] {
  return STATIC_COURSES.map((course, index) => ({
    id: `static-course-${index + 1}`,
    slug: course.slug,
    name: course.title,
    duration: `${course.duration} | ${course.days}`,
    summary: course.summary,
    description: course.summary,
    priceFrom: course.priceFrom,
    priceFull: null,
    image: course.image,
    isActive: true,
    modules: course.modules.map((module, moduleIndex) => ({
      id: `static-module-${course.slug}-${moduleIndex + 1}`,
      title: module.title,
      description: module.desc,
      order: moduleIndex,
      hours: null,
    })),
    batches: BATCHES
      .filter((batch) => batch.course.toLowerCase().includes(course.slug.replace("hr", "-hour")))
      .map((batch, batchIndex) => ({
        id: `static-batch-${course.slug}-${batchIndex + 1}`,
        name: `${batch.course} - ${batch.start}`,
        startDate: new Date(batch.start).toISOString(),
        endDate: new Date(batch.end).toISOString(),
        priceRegular: Number(batch.price.replace(/[^0-9]/g, "")) || course.priceFrom,
        enrolled: batch.status.toLowerCase().includes("4 seats") ? 16 : batch.status.toLowerCase().includes("6 seats") ? 14 : 0,
        capacity: 20,
        accommodation: [],
      })),
  }));
}

function mergeStaticMissing(courses: Record<string, unknown>[], locale: Locale): PublicCourse[] {
  const existing = new Set(courses.map((course) => course.slug));
  const missingStatic = getStaticPublicCourses().filter((course) => !existing.has(course.slug));
  return [
    ...courses.map((course) => applyCourseTranslation(course as CourseWithTranslations<Record<string, unknown>>, locale) as PublicCourse),
    ...missingStatic,
  ];
}

export async function getPublicCourses(
  locale: Locale,
  slug?: string,
  onError?: (error: unknown) => void,
): Promise<{ courses: PublicCourse[]; fallback?: boolean }> {
  const cacheKey = `courses:${locale}:${slug || "all"}`;
  const cached = getCached<{ courses: PublicCourse[]; fallback?: boolean }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        isActive: true,
        ...(slug ? { slug } : {}),
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
        batches: {
          where: {
            status: "OPEN",
            endDate: { gte: new Date() },
          },
          include: {
            accommodation: true,
          },
          orderBy: { startDate: "asc" },
          take: 5,
        },
      },
      orderBy: { priceFrom: "asc" },
    });

    if (slug && courses.length === 0) {
      return {
        courses: getStaticPublicCourses().filter((course) => course.slug === slug),
        fallback: true,
      };
    }

    const result = {
      courses: slug ? (courses.map((course) => applyCourseTranslation(course, locale)) as PublicCourse[]) : mergeStaticMissing(courses, locale),
    };
    setCached(cacheKey, result, 300); // 5 minutes
    return result;
  } catch (error) {
    onError?.(error);
    return {
      courses: getStaticPublicCourses().filter((course) => (slug ? course.slug === slug : true)),
      fallback: true,
    };
  }
}
