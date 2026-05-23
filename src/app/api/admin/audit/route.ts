import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  entity: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  actor: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      entity: searchParams.get("entity") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      actor: searchParams.get("actor") ?? undefined,
    });

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(query.entity ? { entity: query.entity } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(query.actor
          ? {
              user: {
                email: {
                  contains: query.actor,
                  mode: "insensitive",
                },
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });

    return jsonWithRequestId({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: {
          email: log.user.email,
          displayName: log.user.displayName,
        },
      })),
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.audit.list", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to fetch audit logs" }, { status: 500 }, request);
  }
}
