import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getCached, setCached } from "../../../lib/runtime-cache";

export const dynamic = "force-dynamic";
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

function getLimit(request: NextRequest) {
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT);
  if (!Number.isFinite(requestedLimit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(requestedLimit), 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const limit = getLimit(request);
  const cacheKey = `public_testimonials_cache:${limit}`;
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return jsonWithRequestId(cached, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  }

  try {
    const [testimonials, aggregates] = await Promise.all([
      prisma.testimonial.findMany({
        where: { status: "APPROVED" },
        select: {
          id: true,
          courseName: true,
          quote: true,
          rating: true,
          location: true,
          graduationYear: true,
          student: {
            select: {
              enrolledCourse: true,
              user: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.testimonial.aggregate({
        where: { status: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const responseBody = {
      testimonials: testimonials.map((item) => ({
        id: item.id,
        name: item.student.user.displayName || "Bali YTTC Graduate",
        course: item.courseName || item.student.enrolledCourse || "Graduate",
        quote: item.quote,
        rating: item.rating,
        location: item.location,
        graduationYear: item.graduationYear,
      })),
      stats: {
        averageRating: Number((aggregates._avg.rating || 0).toFixed(1)),
        totalApproved: aggregates._count.id || 0,
      },
    };

    setCached(cacheKey, responseBody, 300); // 5 minutes

    return jsonWithRequestId(responseBody, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  } catch (error) {
    logApiError("testimonials.public", error, request);
    return jsonWithRequestId({ error: "Failed to fetch testimonials" }, {
      status: 500,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  }
}
