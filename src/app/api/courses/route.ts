import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { BATCHES, COURSES as STATIC_COURSES } from "@/data/site";
import { applyCourseTranslation, normalizeLocale } from "@/lib/localized-content";
import type { Locale } from "@/i18n/routing";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const courseSlugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/).optional();

function getStaticCourses() {
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

function mergeStaticMissing(courses: Record<string, unknown>[], locale: Locale) {
  const existing = new Set(courses.map((course) => course.slug));
  const missingStatic = getStaticCourses().filter((course) => !existing.has(course.slug));
  return [
    ...courses.map((course) => applyCourseTranslation(course as CourseWithTranslations<Record<string, unknown>>, locale)),
    ...missingStatic,
  ];
}

type CourseWithTranslations<T extends Record<string, unknown>> = T & {
  translations?: unknown;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsedSlug = courseSlugSchema.safeParse(searchParams.get("slug") ?? undefined);
  if (!parsedSlug.success) {
    return jsonWithRequestId(
      { error: "Validation failed", details: parsedSlug.error.errors },
      { status: 400 },
      request,
    );
  }
  const slug = parsedSlug.data;
  const locale = normalizeLocale(searchParams.get("locale"));

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
      return jsonWithRequestId({
        courses: getStaticCourses().filter((course) => course.slug === slug),
        locale,
        fallback: true,
      }, undefined, request);
    }

    return jsonWithRequestId({
      courses: slug ? courses.map((course) => applyCourseTranslation(course, locale)) : mergeStaticMissing(courses, locale),
      locale,
    }, undefined, request);
  } catch (error) {
    logApiError("courses.public", error, request, { slug, locale });
    const staticCourses = getStaticCourses().filter((course) => (slug ? course.slug === slug : true));
    return jsonWithRequestId({
      courses: staticCourses,
      fallback: true,
    }, undefined, request);
  }
}
