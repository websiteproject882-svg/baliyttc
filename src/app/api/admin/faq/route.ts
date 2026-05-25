import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { invalidateCacheByPrefix } from "../../../../lib/runtime-cache";

export const dynamic = "force-dynamic";

const faqIdSchema = z.string().trim().min(1).max(120);

const faqSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(5000),
  category: z.string().trim().min(1).max(80),
  keywords: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  locale: z.string().trim().min(2).max(8).default("en"),
  isActive: z.boolean().default(true),
});

const updateSchema = faqSchema.extend({
  id: faqIdSchema,
});

const listQuerySchema = z.object({
  locale: z.string().trim().min(2).max(8).optional(),
  category: z.string().trim().min(1).max(80).optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("faq.view");
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsedQuery = listQuerySchema.safeParse({
    locale: searchParams.get("locale") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });
  if (!parsedQuery.success) {
    return jsonWithRequestId({ error: "Validation failed", details: parsedQuery.error.errors }, { status: 400 }, request);
  }
  const { locale, category } = parsedQuery.data;

  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        ...(locale ? { locale } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ locale: "asc" }, { category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return jsonWithRequestId({ faqs }, undefined, request);
  } catch (error) {
    logApiError("admin.faq.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch FAQs" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  try {
    const parsed = faqSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const lastFaq = await prisma.fAQ.findFirst({
      where: { locale: data.locale, category: data.category },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const faq = await prisma.fAQ.create({
      data: {
        ...data,
        order: (lastFaq?.order ?? -1) + 1,
      },
    });

    invalidateCacheByPrefix("public_faq_cache:");

    await writeAuditLog({
      actorUserId: user.id,
      action: "faq.created",
      entity: "faq",
      entityId: faq.id,
      newValue: faq,
      request,
    });

    return jsonWithRequestId({ success: true, faq }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.faq.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create FAQ" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  try {
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.fAQ.findUnique({ where: { id: data.id } });
    if (!existing) {
      return jsonWithRequestId({ error: "FAQ not found" }, { status: 404 }, request);
    }

    const faq = await prisma.fAQ.update({
      where: { id: data.id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        keywords: data.keywords,
        locale: data.locale,
        isActive: data.isActive,
      },
    });

    invalidateCacheByPrefix("public_faq_cache:");

    await writeAuditLog({
      actorUserId: user.id,
      action: "faq.updated",
      entity: "faq",
      entityId: faq.id,
      oldValue: existing,
      newValue: faq,
      request,
    });

    return jsonWithRequestId({ success: true, faq }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.faq.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update FAQ" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");
    if (!rawId) {
      return jsonWithRequestId({ error: "FAQ id is required" }, { status: 400 }, request);
    }
    const parsedId = faqIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsedId.error.errors }, { status: 400 }, request);
    }
    const id = parsedId.data;

    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "FAQ not found" }, { status: 404 }, request);
    }

    await prisma.fAQ.delete({ where: { id } });

    invalidateCacheByPrefix("public_faq_cache:");

    await writeAuditLog({
      actorUserId: user.id,
      action: "faq.deleted",
      entity: "faq",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.faq.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete FAQ" }, { status: 500 }, request);
  }
}
