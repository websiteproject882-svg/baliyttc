import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const faqSchema = z.object({
  question: z.string().min(3).max(300),
  answer: z.string().min(3).max(5000),
  category: z.string().min(1).max(80),
  keywords: z.array(z.string().min(1).max(80)).default([]),
  locale: z.string().min(2).max(8).default("en"),
  isActive: z.boolean().default(true),
});

const updateSchema = faqSchema.extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("faq.view");
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const category = searchParams.get("category");

  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        ...(locale ? { locale } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ locale: "asc" }, { category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("GET admin FAQ error:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  try {
    const data = faqSchema.parse(await request.json());
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

    await writeAuditLog({
      actorUserId: user.id,
      action: "faq.created",
      entity: "faq",
      entityId: faq.id,
      newValue: faq,
      request,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST admin FAQ error:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  try {
    const data = updateSchema.parse(await request.json());
    const existing = await prisma.fAQ.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
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

    await writeAuditLog({
      actorUserId: user.id,
      action: "faq.updated",
      entity: "faq",
      entityId: faq.id,
      oldValue: existing,
      newValue: faq,
      request,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH admin FAQ error:", error);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("faq.edit");
  if (!user || response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "FAQ id is required" }, { status: 400 });
  }

  const existing = await prisma.fAQ.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  await prisma.fAQ.delete({ where: { id } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "faq.deleted",
    entity: "faq",
    entityId: id,
    oldValue: existing,
    request,
  });

  return NextResponse.json({ success: true });
}
