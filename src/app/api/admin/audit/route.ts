import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const actor = searchParams.get("actor");

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entity ? { entity } : {}),
        ...(action ? { action } : {}),
        ...(actor
          ? {
              user: {
                email: {
                  contains: actor,
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
      take: limit,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("GET audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
