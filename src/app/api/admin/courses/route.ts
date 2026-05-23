import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const courseSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string()
    .trim()
    .min(2)
    .max(180)
    .transform((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
    .pipe(z.string().regex(/^[a-z0-9-]+$/)),
  duration: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(600),
  description: z.string().trim().min(20).max(20000),
  priceFrom: z.coerce.number().nonnegative(),
  priceFull: z.coerce.number().nonnegative().nullable().optional(),
  image: z.string().url().optional().or(z.literal("")),
  translations: z.record(z.object({
    name: z.string().trim().max(160).optional(),
    duration: z.string().trim().max(80).optional(),
    summary: z.string().trim().max(600).optional(),
    description: z.string().trim().max(20000).optional(),
    image: z.string().url().optional().or(z.literal("")),
  }).partial()).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = courseSchema.extend({
  id: z.string().trim().min(1).max(120),
});

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("courses.view");
  if (response) {
    return response;
  }

  try {
    const courses = await prisma.course.findMany({
      include: {
        modules: { orderBy: { order: "asc" } },
        batches: {
          include: {
            _count: { select: { students: true } },
          },
          orderBy: { startDate: "asc" },
        },
        _count: {
          select: {
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return jsonWithRequestId({ courses }, undefined, request);
  } catch (error) {
    logApiError("admin.courses.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch courses" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("courses.create");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = courseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const course = await prisma.course.create({
      data: {
        ...data,
        priceFull: data.priceFull ?? null,
        image: data.image || null,
        translations: data.translations ?? undefined,
        isActive: data.isActive ?? true,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "course.created",
      entity: "course",
      entityId: course.id,
      newValue: course,
      request,
    });

    return jsonWithRequestId({ success: true, course }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.courses.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create course" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("courses.edit");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.course.findUnique({ where: { id } });

    if (!existing) {
      return jsonWithRequestId({ error: "Course not found" }, { status: 404 }, request);
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...data,
        priceFull: data.priceFull ?? null,
        image: data.image || null,
        translations: data.translations ?? undefined,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "course.updated",
      entity: "course",
      entityId: course.id,
      oldValue: existing,
      newValue: course,
      request,
    });

    return jsonWithRequestId({ success: true, course }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.courses.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update course" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("courses.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = deleteQuerySchema.safeParse({ id: searchParams.get("id") });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Course id is required" }, { status: 400 }, request);
    }
    const { id } = parsedQuery.data;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Course not found" }, { status: 404 }, request);
    }

    await prisma.course.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "course.deleted",
      entity: "course",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.courses.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete course" }, { status: 500 }, request);
  }
}
