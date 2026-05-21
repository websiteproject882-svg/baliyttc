import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

// Re-export leads routes with admin-specific features
export async function GET(request: NextRequest) {
  const { response } = await requirePermission("leads.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [leads, total, statusCounts] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const counts = statusCounts.reduce((acc: Record<string, number>, s: { status: string; _count: number }) => {
      acc[s.status] = s._count;
      return acc;
    }, {});

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: counts,
    });
  } catch (error) {
    console.error("GET admin leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("leads.edit");
  if (!user || response) {
    return response;
  }

  try {
    const body = await request.json();
    const { id, status, notes, assignedTo, followUpAt } = body;

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(followUpAt && { followUpAt: new Date(followUpAt) }),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "lead.updated",
      entity: "lead",
      entityId: lead.id,
      oldValue: existing,
      newValue: lead,
      request,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("PATCH admin lead error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("leads.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "lead.deleted",
      entity: "lead",
      entityId: id,
      oldValue: existing,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE lead error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
