import { NextRequest, NextResponse } from "next/server";
import { NotificationAudience, NotificationType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const notificationSchema = z.object({
  title: z.string().min(3).max(160),
  message: z.string().min(5).max(4000),
  type: z.nativeEnum(NotificationType),
  audience: z.nativeEnum(NotificationAudience),
  batchId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  actionUrl: z.string().optional().nullable(),
});

const updateSchema = notificationSchema.extend({
  id: z.string(),
});

export async function GET() {
  const { response } = await requirePermission("announcements.view");
  if (response) {
    return response;
  }

  const notifications = await prisma.notification.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.create");
  if (!user || response) {
    return response;
  }

  try {
    const data = notificationSchema.parse(await request.json());
    const notification = await prisma.notification.create({
      data: {
        ...data,
        batchId: data.batchId || null,
        studentId: data.audience === "INDIVIDUAL" ? data.studentId || null : null,
        actionUrl: data.actionUrl || null,
        publishedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "notification.created",
      entity: "notification",
      entityId: notification.id,
      newValue: notification,
      request,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST admin notifications error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.edit");
  if (!user || response) {
    return response;
  }

  try {
    const data = updateSchema.parse(await request.json());
    const existing = await prisma.notification.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const notification = await prisma.notification.update({
      where: { id: data.id },
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        audience: data.audience,
        batchId: data.batchId || null,
        studentId: data.audience === "INDIVIDUAL" ? data.studentId || null : null,
        actionUrl: data.actionUrl || null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "notification.updated",
      entity: "notification",
      entityId: notification.id,
      oldValue: existing,
      newValue: notification,
      request,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH admin notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.edit");
  if (!user || response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
  }

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await prisma.notification.delete({ where: { id } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "notification.deleted",
    entity: "notification",
    entityId: id,
    oldValue: existing,
    request,
  });

  return NextResponse.json({ success: true });
}
