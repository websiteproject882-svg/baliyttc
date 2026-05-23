import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const courseSchema = z.object({
  name: z.string().min(2),
  slug: z.string()
    .min(2)
    .transform((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
    .pipe(z.string().regex(/^[a-z0-9-]+$/)),
  duration: z.string().min(2),
  summary: z.string().min(10),
  description: z.string().min(20),
  priceFrom: z.coerce.number().nonnegative(),
  priceFull: z.coerce.number().nonnegative().nullable().optional(),
  image: z.string().url().optional().or(z.literal("")),
  translations: z.record(z.object({
    name: z.string().optional(),
    duration: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal("")),
  }).partial()).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = courseSchema.extend({
  id: z.string(),
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
    const data = courseSchema.parse(await request.json());
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
    const { id, ...data } = updateSchema.parse(await request.json());
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
    const id = searchParams.get("id");

    if (!id) {
      return jsonWithRequestId({ error: "Course id is required" }, { status: 400 }, request);
    }

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
