import { NextRequest } from "next/server";
import { z } from "zod";
import { normalizeLocale } from "@/lib/localized-content";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getPublicCourses, getStaticPublicCourses } from "../../../lib/public-courses";

export const dynamic = "force-dynamic";

const courseSlugSchema = z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/).optional();

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
    const result = await getPublicCourses(locale, slug, (error) => {
      logApiError("courses.public", error, request, { slug, locale });
    });
    return jsonWithRequestId({
      courses: result.courses,
      locale,
      ...(result.fallback ? { fallback: true } : {}),
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  } catch (error) {
    logApiError("courses.public", error, request, { slug, locale });
    return jsonWithRequestId({
      courses: getStaticPublicCourses().filter((course) => (slug ? course.slug === slug : true)),
      fallback: true,
    }, undefined, request);
  }
}
