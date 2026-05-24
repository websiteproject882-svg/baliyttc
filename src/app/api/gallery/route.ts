import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 24;

function getLimit(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT);
  if (!Number.isFinite(rawLimit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const images = await prisma.galleryImage.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "APPROVED" }],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: getLimit(request),
      select: {
        id: true,
        url: true,
        alt: true,
        caption: true,
        category: true,
        type: true,
      },
    });

    return jsonWithRequestId({ images }, undefined, request);
  } catch (error) {
    logApiError("gallery.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch gallery" }, { status: 500 }, request);
  }
}
