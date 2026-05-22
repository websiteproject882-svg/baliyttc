import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuthenticatedUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";

const ALLOWED_TEACHER_SCHEDULE_ROLES = new Set([
  "TEACHER",
  "SUPER_ADMIN",
  "ADMIN",
  "COURSE_MANAGER",
  "STUDENT_MANAGER",
]);

const scheduleBaseSchema = z.object({
  batchId: z.string().min(1),
  teacherId: z.string().min(1).nullable().optional(),
  date: z.string().datetime(),
  dayNumber: z.number().int().min(0),
  activities: z.array(z.unknown()).default([]),
  ceremonyBlocked: z.boolean().default(false),
  notes: z.string().max(2000).nullable().optional(),
});

const scheduleUpdateSchema = scheduleBaseSchema.partial().extend({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (!ALLOWED_TEACHER_SCHEDULE_ROLES.has(user.role) && !hasPermission(user.role, "schedule.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (batchId) where.batchId = batchId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as any).gte = new Date(startDate);
      if (endDate) (where.date as any).lte = new Date(endDate);
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

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("GET schedule error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (!ALLOWED_TEACHER_SCHEDULE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { batchId, teacherId, date, dayNumber, activities, ceremonyBlocked, notes } =
      scheduleBaseSchema.parse(await request.json());

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

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST schedule error:", error);
    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (!ALLOWED_TEACHER_SCHEDULE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, ...data } = scheduleUpdateSchema.parse(await request.json());

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
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

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH schedule error:", error);
    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (!ALLOWED_TEACHER_SCHEDULE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE schedule error:", error);
    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 });
  }
}
