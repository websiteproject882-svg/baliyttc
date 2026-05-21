import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["WAITING", "NOTIFIED", "CONVERTED", "EXPIRED", "DECLINED"]),
  notes: z.string().optional(),
});

export async function GET() {
  const { response } = await requirePermission("waitlist.view");
  if (response) {
    return response;
  }

  try {
    const waitlist = await prisma.waitlist.findMany({
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });
    return NextResponse.json({ waitlist });
  } catch (error) {
    console.error("GET waitlist error:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("waitlist.edit");
  if (!user || response) {
    return response;
  }

  try {
    const data = updateStatusSchema.parse(await request.json());
    const existing = await prisma.waitlist.findUnique({ where: { id: data.id } });

    if (!existing) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "CONVERTED") {
      updateData.convertedAt = new Date();
    }

    const entry = await prisma.waitlist.update({
      where: { id: data.id },
      data: updateData,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "waitlist.status_updated",
      entity: "waitlist",
      entityId: data.id,
      oldValue: existing,
      newValue: entry,
      request,
    });

    return NextResponse.json({ success: true, waitlist: entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH waitlist error:", error);
    return NextResponse.json({ error: "Failed to update waitlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("waitlist.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.waitlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    await prisma.waitlist.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "waitlist.deleted",
      entity: "waitlist",
      entityId: id,
      oldValue: existing,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE waitlist error:", error);
    return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 });
  }
}
