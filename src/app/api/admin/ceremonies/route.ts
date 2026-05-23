import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

// Note: Ceremonies are stored in the ScheduleEntry table with ceremonyBlocked flag
// This API manages ceremony dates which block class in student schedules

const ceremonySchema = z.object({
  name: z.string().min(1).max(160),
  date: z.string().min(1),
  description: z.string().max(1000).optional(),
  type: z.string().max(80).optional(),
  noClass: z.boolean().default(true),
  batchIds: z.array(z.string().min(1)).default([]),
});

const ceremonyUpdateSchema = ceremonySchema.partial().extend({
  id: z.string().min(1),
  batchIds: z.array(z.string().min(1)).optional(),
});

function parseCeremonyDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Invalid ceremony date",
      },
    ]);
  }
  return date;
}

async function resolveBatchId(batchIds: string[] | undefined) {
  if (batchIds?.[0]) return batchIds[0];

  const batch = await prisma.batch.findFirst({
    orderBy: { startDate: "asc" },
    select: { id: true },
  });

  return batch?.id ?? null;
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    // Get ceremonies from schedule entries
    const ceremonies = await prisma.scheduleEntry.findMany({
      where: { ceremonyBlocked: true },
      orderBy: { date: "asc" },
    });

    // Transform to ceremony format
    const formattedCeremonies = ceremonies.map(entry => ({
      id: entry.id,
      name: entry.notes || "Ceremony Day",
      date: entry.date.toISOString().split("T")[0],
      description: entry.notes,
      type: "temple",
      noClass: true,
      batchIds: [entry.batchId],
    }));

    return jsonWithRequestId({ ceremonies: formattedCeremonies }, undefined, request);
  } catch (error) {
    logApiError("admin.ceremonies.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch ceremonies" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { name, date, description, type, noClass, batchIds } = ceremonySchema.parse(await request.json());
    const batchId = await resolveBatchId(batchIds);
    if (!batchId) {
      return jsonWithRequestId({ error: "At least one batch is required before adding ceremonies" }, { status: 400 }, request);
    }

    // Create a schedule entry for the ceremony
    const ceremony = await prisma.scheduleEntry.create({
      data: {
        date: parseCeremonyDate(date),
        dayNumber: 0, // Special day
        activities: [] as Prisma.InputJsonValue,
        ceremonyBlocked: true,
        notes: name,
        batchId,
      },
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "ceremony.created",
      entity: "scheduleEntry",
      entityId: ceremony.id,
      newValue: { name, date, batchId },
      request,
    });

    return jsonWithRequestId({
      ceremony: {
        id: ceremony.id,
        name,
        date,
        description,
        type,
        noClass,
        batchIds: [batchId],
      },
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.ceremonies.create", error, request, { userId: user?.id });
    return jsonWithRequestId({ error: "Failed to create ceremony" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { id, name, date, batchIds } = ceremonyUpdateSchema.parse(await request.json());
    const updateData: Prisma.ScheduleEntryUncheckedUpdateInput = {};
    if (date) updateData.date = parseCeremonyDate(date);
    if (name) updateData.notes = name;
    if (batchIds !== undefined) {
      const batchId = await resolveBatchId(batchIds);
      if (!batchId) {
        return jsonWithRequestId({ error: "At least one batch is required before updating ceremonies" }, { status: 400 }, request);
      }
      updateData.batchId = batchId;
    }

    const ceremony = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "ceremony.updated",
      entity: "scheduleEntry",
      entityId: ceremony.id,
      newValue: { name, date, batchIds },
      request,
    });

    return jsonWithRequestId({ success: true, ceremony }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonWithRequestId({ error: "Ceremony not found" }, { status: 404 }, request);
    }
    logApiError("admin.ceremonies.update", error, request, { userId: user?.id });
    return jsonWithRequestId({ error: "Failed to update ceremony" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonWithRequestId({ error: "Ceremony id is required" }, { status: 400 }, request);
    }

    await prisma.scheduleEntry.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "ceremony.deleted",
      entity: "scheduleEntry",
      entityId: id,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonWithRequestId({ error: "Ceremony not found" }, { status: 404 }, request);
    }
    logApiError("admin.ceremonies.delete", error, request, { userId: user?.id });
    return jsonWithRequestId({ error: "Failed to delete ceremony" }, { status: 500 }, request);
  }
}
