import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getCached, setCached } from "../../../lib/runtime-cache";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 24;

function getLimit(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT);
  if (!Number.isFinite(rawLimit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const limit = getLimit(request);
  const cacheKey = `public_gallery_cache:${limit}`;
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return jsonWithRequestId(cached, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  }

  try {
    const images = await prisma.galleryImage.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "APPROVED" }],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        url: true,
        alt: true,
        caption: true,
        category: true,
        type: true,
      },
    });

    const responseBody = { images };
    setCached(cacheKey, responseBody, 300); // 5 minutes

    return jsonWithRequestId(responseBody, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  } catch (error) {
    logApiError("gallery.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch gallery" }, {
      status: 500,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    }, request);
  }
}
