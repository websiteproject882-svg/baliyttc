import type { Metadata } from "next";
import CoursePage from "@/views/CoursePage";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { notFound } from "next/navigation";
import { courseSeo, courseSlugs, getStaticCourse } from "@/lib/course-static";
import { CourseSchema } from "@/components/shared/SchemaMarkup";

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");

export function generateStaticParams() {
  return courseSlugs.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const course = getStaticCourse(params.slug);
  if (!course) {
    return {
      title: "Course Not Found | Bali YTTC",
    };
  }

  const seo = courseSeo[course.slug];
  const url = `${baseUrl}/${params.locale}/courses/${course.slug}`;

  return {
    title: seo.title,
    description: seo.description,
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

export default function CourseDynamicPage({ params }: { params: { locale: string; slug: string } }) {
  const course = getStaticCourse(params.slug);
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
