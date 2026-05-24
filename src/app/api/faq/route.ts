import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

function getLimit(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT);
  if (!Number.isFinite(rawLimit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));

  try {
    let effectiveLocale = locale;
    let faqs = await prisma.fAQ.findMany({
      where: {
        locale,
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: getLimit(request),
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
      },
    });

    if (faqs.length === 0 && locale !== defaultLocale) {
      effectiveLocale = defaultLocale;
      faqs = await prisma.fAQ.findMany({
        where: {
          locale: defaultLocale,
          isActive: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: getLimit(request),
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
        },
      });
    }

    return jsonWithRequestId({ faqs, locale: effectiveLocale }, undefined, request);
  } catch (error) {
    logApiError("faq.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch FAQs" }, { status: 500 }, request);
  }
}
