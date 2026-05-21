import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, writeAuditLog } from "@/lib/authz";

// Note: Ceremonies are stored in the ScheduleEntry table with ceremonyBlocked flag
// This API manages ceremony dates which block class in student schedules

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
  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const body = await request.json();
    const { name, date, description, type, noClass, batchIds } = body;

    // Create a schedule entry for the ceremony
    const ceremony = await prisma.scheduleEntry.create({
      data: {
        date: new Date(date),
        dayNumber: 0, // Special day
        activities: JSON.stringify([]),
        ceremonyBlocked: true,
        notes: name,
        batchId: batchIds?.[0] || null,
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
    console.error("Ceremony create error:", error);
    return NextResponse.json({ error: "Failed to create ceremony" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
