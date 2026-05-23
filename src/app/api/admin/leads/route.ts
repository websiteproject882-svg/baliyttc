import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const leadUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "ENROLLED", "NOT_INTERESTED", "SPAM"]).optional(),
  notes: z.string().max(5000).nullable().optional(),
  assignedTo: z.string().max(120).nullable().optional(),
  followUpAt: z
    .string()
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Invalid date")
    .nullable()
    .optional(),
});

// Re-export leads routes with admin-specific features
export async function GET(request: NextRequest) {
  const { response } = await requirePermission("leads.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

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

    return jsonWithRequestId({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: counts,
    }, undefined, request);
  } catch (error) {
    logApiError("admin.leads.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch leads" }, { status: 500 }, request);
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
    const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, status, notes, assignedTo, followUpAt } = parsed.data;

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Lead not found" }, { status: 404 }, request);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(followUpAt !== undefined && { followUpAt: followUpAt ? new Date(followUpAt) : null }),
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

    return jsonWithRequestId({ success: true, lead }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.leads.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update lead" }, { status: 500 }, request);
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
    if (!id) return jsonWithRequestId({ error: "Lead id is required" }, { status: 400 }, request);

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Lead not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.leads.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete lead" }, { status: 500 }, request);
  }
}
