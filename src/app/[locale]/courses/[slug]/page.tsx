import type { Metadata } from "next";
import CoursePage from "@/views/CoursePage";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { notFound } from "next/navigation";
import { courseSeo, courseSlugs, getStaticCourse, type CourseSlug, type StaticCoursePageData } from "@/lib/course-static";
import { CourseSchema } from "@/components/shared/SchemaMarkup";
import { applyCourseTranslation, normalizeLocale } from "@/lib/localized-content";
import prisma from "@/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return courseSlugs.map((slug) => ({ slug }));
}

async function getPublicCourse(slug: string, localeParam: string): Promise<StaticCoursePageData | null> {
  const staticCourse = getStaticCourse(slug);
  if (!staticCourse) return null;

  try {
    const dbCourse = await prisma.course.findFirst({
      where: {
        slug,
        isActive: true,
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
          orderBy: { startDate: "asc" },
          take: 5,
        },
      },
    });

    if (!dbCourse) return staticCourse;

    const localized = applyCourseTranslation(dbCourse, normalizeLocale(localeParam));

    return {
      ...staticCourse,
      id: localized.id,
      slug: staticCourse.slug as CourseSlug,
      name: String(localized.name || staticCourse.name),
      duration: String(localized.duration || staticCourse.duration),
      summary: String(localized.summary || staticCourse.summary),
      description: String(localized.description || staticCourse.description),
      priceFrom: Number(localized.priceFrom || staticCourse.priceFrom),
      priceFull: localized.priceFull ? Number(localized.priceFull) : staticCourse.priceFull,
      image: String(localized.image || staticCourse.image),
      modules:
        dbCourse.modules.length > 0
          ? dbCourse.modules.map((module) => ({
              title: module.title,
              description: module.description,
              hours: module.hours || 15,
            }))
          : staticCourse.modules,
      batches:
        dbCourse.batches.length > 0
          ? dbCourse.batches.map((batch) => ({
              id: batch.id,
              name: batch.name,
              startDate: batch.startDate.toISOString(),
              priceRegular: batch.priceRegular,
              enrolled: batch.enrolled,
              capacity: batch.capacity,
            }))
          : staticCourse.batches,
    };
  } catch {
    return staticCourse;
  }
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const course = await getPublicCourse(params.slug, params.locale);
  if (!course) {
    return {
      title: "Course Not Found | Bali YTTC",
    };
  }

  const seo = courseSeo[course.slug] || {
    title: `${course.name} | Bali YTTC`,
    description: course.summary,
    keyword: course.name,
  };
  const url = `${baseUrl}/${params.locale}/courses/${course.slug}`;

  return {
    title: course.name === getStaticCourse(course.slug)?.name ? seo.title : `${course.name} | Bali YTTC`,
    description: course.summary || seo.description,
    keywords: [seo.keyword, course.name, "Ubud Bali yoga school", "Yoga Alliance Bali"],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: "Bali YTTC",
      type: "website",
      images: [
        {
          url: course.image,
          width: 1200,
          height: 630,
          alt: course.name,
        },
      ],
    },
  };
}

export default async function CourseDynamicPage({ params }: { params: { locale: string; slug: string } }) {
  const course = await getPublicCourse(params.slug, params.locale);
  if (!course) {
    notFound();
  }

  return (
    <NextLayoutWrapper>
      <CourseSchema course={course} locale={params.locale} />
      <CoursePage initialCourse={course} />
    </NextLayoutWrapper>
  );
}
