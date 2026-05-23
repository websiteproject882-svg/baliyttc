import { BatchStatus, RoomType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const accommodationSchema = z.object({
  type: z.nativeEnum(RoomType),
  price: z.coerce.number().nonnegative(),
  mandatory: z.boolean().default(false),
});

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");
const nullableDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
  .nullable()
  .optional();

const batchBaseSchema = z.object({
  courseId: z.string(),
  name: z.string().min(2),
  startDate: dateString,
  endDate: dateString,
  capacity: z.coerce.number().int().positive(),
  priceRegular: z.coerce.number().nonnegative(),
  priceEarlyBird: z.coerce.number().nonnegative().nullable().optional(),
  earlyBirdDeadline: nullableDateString,
  status: z.nativeEnum(BatchStatus).default(BatchStatus.DRAFT),
  waitlistEnabled: z.boolean().default(false),
  accommodation: z.array(accommodationSchema).default([]),
});

const validateDateOrder = (data: { startDate: string; endDate: string }, ctx: z.RefinementCtx) => {
  if (new Date(data.endDate).getTime() < new Date(data.startDate).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be after start date",
    });
  }
};

const batchSchema = batchBaseSchema.superRefine(validateDateOrder);

const updateSchema = batchBaseSchema.extend({
  id: z.string(),
  enrolled: z.coerce.number().int().nonnegative().optional(),
}).superRefine(validateDateOrder);

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("batches.view");
  if (response) {
    return response;
  }

  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        accommodation: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });
    return jsonWithRequestId({ batches }, undefined, request);
  } catch (error) {
    logApiError("admin.batches.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch batches" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("batches.create");
  if (!user || response) {
    return response;
  }

  try {
    const data = batchSchema.parse(await request.json());
    const batch = await prisma.batch.create({
      data: {
        courseId: data.courseId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity,
        enrolled: 0,
        priceRegular: data.priceRegular,
        priceEarlyBird: data.priceEarlyBird ?? null,
        earlyBirdDeadline: data.earlyBirdDeadline ? new Date(data.earlyBirdDeadline) : null,
        status: data.status,
        waitlistEnabled: data.waitlistEnabled,
        accommodation: {
          create: data.accommodation,
        },
      },
      include: { course: true, accommodation: true },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "batch.created",
      entity: "batch",
      entityId: batch.id,
      newValue: batch,
      request,
    });

    return jsonWithRequestId({ success: true, batch }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.batches.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create batch" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("batches.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { id, accommodation, ...data } = updateSchema.parse(await request.json());
    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { accommodation: true },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Batch not found" }, { status: 404 }, request);
    }

    await prisma.accommodation.deleteMany({ where: { batchId: id } });

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        courseId: data.courseId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity,
        enrolled: data.enrolled ?? existing.enrolled,
        priceRegular: data.priceRegular,
        priceEarlyBird: data.priceEarlyBird ?? null,
        earlyBirdDeadline: data.earlyBirdDeadline ? new Date(data.earlyBirdDeadline) : null,
        status: data.status,
        waitlistEnabled: data.waitlistEnabled,
        accommodation: {
          create: accommodation,
        },
      },
      include: { course: true, accommodation: true },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "batch.updated",
      entity: "batch",
      entityId: batch.id,
      oldValue: existing,
      newValue: batch,
      request,
    });

    return jsonWithRequestId({ success: true, batch }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.batches.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update batch" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("batches.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return jsonWithRequestId({ error: "Batch id is required" }, { status: 400 }, request);
    }

    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { accommodation: true },
    });
    if (!existing) {
      return jsonWithRequestId({ error: "Batch not found" }, { status: 404 }, request);
    }

    await prisma.batch.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "batch.deleted",
      entity: "batch",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.batches.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete batch" }, { status: 500 }, request);
  }
}
