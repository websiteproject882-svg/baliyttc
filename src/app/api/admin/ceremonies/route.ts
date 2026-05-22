import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";

// Note: Ceremonies are stored in the ScheduleEntry table with ceremonyBlocked flag
// This API manages ceremony dates which block class in student schedules

const ceremonySchema = z.object({
  name: z.string().min(1).max(160),
  date: z.string().datetime(),
  description: z.string().max(1000).optional(),
  type: z.string().max(80).optional(),
  noClass: z.boolean().default(true),
  batchIds: z.array(z.string().min(1)).min(1),
});

const ceremonyUpdateSchema = ceremonySchema.partial().extend({
  id: z.string().min(1),
  batchIds: z.array(z.string().min(1)).min(1).optional(),
});

export async function GET() {
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
      batchIds: [],
    }));

    return NextResponse.json({ ceremonies: formattedCeremonies });
  } catch (error) {
    console.error("Ceremonies fetch error:", error);
    return NextResponse.json({ ceremonies: [] });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { name, date, description, type, noClass, batchIds } = ceremonySchema.parse(await request.json());

    // Create a schedule entry for the ceremony
    const ceremony = await prisma.scheduleEntry.create({
      data: {
        date: new Date(date),
        dayNumber: 0, // Special day
        activities: [] as Prisma.InputJsonValue,
        ceremonyBlocked: true,
        notes: name,
        batchId: batchIds[0],
      },
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "ceremony.created",
      entity: "scheduleEntry",
      entityId: ceremony.id,
      newValue: { name, date },
      request,
    });

    return NextResponse.json({
      ceremony: {
        id: ceremony.id,
        name,
        date,
        description,
        type,
        noClass,
        batchIds,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Ceremony create error:", error);
    return NextResponse.json({ error: "Failed to create ceremony" }, { status: 500 });
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
    if (date) updateData.date = new Date(date);
    if (name) updateData.notes = name;
    if (batchIds !== undefined) updateData.batchId = batchIds[0];

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

    return NextResponse.json({ success: true, ceremony });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Ceremony update error:", error);
    return NextResponse.json({ error: "Failed to update ceremony" }, { status: 500 });
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
      return NextResponse.json({ error: "Ceremony ID required" }, { status: 400 });
    }

    await prisma.scheduleEntry.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "ceremony.deleted",
      entity: "scheduleEntry",
      entityId: id,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ceremony delete error:", error);
    return NextResponse.json({ error: "Failed to delete ceremony" }, { status: 500 });
  }
}
