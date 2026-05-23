import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentUserHasPermission, requireSameOrigin, requireStaffUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const scheduleBaseSchema = z.object({
  batchId: z.string().trim().min(1).max(120),
  teacherId: z.string().trim().min(1).max(120).nullable().optional(),
  date: z.string().datetime(),
  dayNumber: z.number().int().min(0),
  activities: z.array(z.unknown()).max(50).default([]),
  ceremonyBlocked: z.boolean().default(false),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const scheduleUpdateSchema = scheduleBaseSchema.partial().extend({
  id: z.string().trim().min(1).max(120),
});

const scheduleQuerySchema = z.object({
  batchId: z.string().trim().min(1).max(120).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "schedule.view")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const { searchParams } = new URL(request.url);
    const { batchId, startDate, endDate } = scheduleQuerySchema.parse({
      batchId: searchParams.get("batchId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    const where: Record<string, unknown> = {};

    if (batchId) where.batchId = batchId;
    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    }

    const schedule = await prisma.scheduleEntry.findMany({
      where,
      include: {
        batch: {
          include: {
            course: true,
            students: {
              where: { accessLevel: { in: ["PRE_ARRIVAL", "FULL"] } },
              include: {
                user: {
                  select: { displayName: true, email: true },
                },
              },
            },
          },
        },
        teacher: {
          select: { name: true, role: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return jsonWithRequestId({ schedule }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("teacher.schedule.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch schedule" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "schedule.create")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const parsed = scheduleBaseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { batchId, teacherId, date, dayNumber, activities, ceremonyBlocked, notes } = parsed.data;

    const schedule = await prisma.scheduleEntry.create({
      data: {
        batchId,
        teacherId,
        date: new Date(date),
        dayNumber,
        activities: activities as Prisma.InputJsonValue,
        ceremonyBlocked: ceremonyBlocked || false,
        notes,
      },
      include: {
        batch: { include: { course: true } },
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "schedule.created",
      entity: "schedule_entry",
      entityId: schedule.id,
      newValue: schedule,
      request,
    });

    return jsonWithRequestId({ success: true, schedule }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("teacher.schedule.create", error, request);
    return jsonWithRequestId({ error: "Failed to create schedule entry" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "schedule.edit")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const parsed = scheduleUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, ...data } = parsed.data;

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Schedule entry not found" }, { status: 404 }, request);
    }

    const schedule = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        batchId: data.batchId,
        teacherId: data.teacherId,
        date: data.date ? new Date(data.date) : undefined,
        dayNumber: data.dayNumber,
        activities: data.activities as Prisma.InputJsonValue | undefined,
        ceremonyBlocked: data.ceremonyBlocked,
        notes: data.notes,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "schedule.updated",
      entity: "schedule_entry",
      entityId: schedule.id,
      oldValue: existing,
      newValue: schedule,
      request,
    });

    return jsonWithRequestId({ success: true, schedule }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("teacher.schedule.update", error, request);
    return jsonWithRequestId({ error: "Failed to update schedule entry" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "schedule.edit")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonWithRequestId({ error: "id is required" }, { status: 400 }, request);
    }

    if (id.length > 120) {
      return jsonWithRequestId({ error: "Invalid id" }, { status: 400 }, request);
    }

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Schedule entry not found" }, { status: 404 }, request);
    }

    await prisma.scheduleEntry.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "schedule.deleted",
      entity: "schedule_entry",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("teacher.schedule.delete", error, request);
    return jsonWithRequestId({ error: "Failed to delete schedule entry" }, { status: 500 }, request);
  }
}
