import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["WAITING", "NOTIFIED", "CONVERTED", "EXPIRED", "DECLINED"]),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(request: NextRequest) {
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
    return jsonWithRequestId({ waitlist }, undefined, request);
  } catch (error) {
    logApiError("admin.waitlist.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch waitlist" }, { status: 500 }, request);
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
      return jsonWithRequestId({ error: "Waitlist entry not found" }, { status: 404 }, request);
    }

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.status === "NOTIFIED") {
      updateData.notifiedAt = new Date();
    }
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

    return jsonWithRequestId({ success: true, waitlist: entry }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.waitlist.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update waitlist" }, { status: 500 }, request);
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
      return jsonWithRequestId({ error: "Waitlist entry id is required" }, { status: 400 }, request);
    }

    const existing = await prisma.waitlist.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Waitlist entry not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.waitlist.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete waitlist entry" }, { status: 500 }, request);
  }
}
