import { NextRequest } from "next/server";
import { NotificationAudience, NotificationType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().min(1).max(max).optional());

const safeActionUrl = optionalTrimmed(2048).refine((value) => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Action URL must use https or start with /");

const notificationSchema = z.object({
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(4000),
  type: z.nativeEnum(NotificationType),
  audience: z.nativeEnum(NotificationAudience),
  batchId: optionalTrimmed(120),
  studentId: optionalTrimmed(120),
  actionUrl: safeActionUrl,
});

const updateSchema = notificationSchema.extend({
  id: z.string().trim().min(1).max(120),
});

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("announcements.view");
  if (response) {
    return response;
  }

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return jsonWithRequestId({ notifications }, undefined, request);
  } catch (error) {
    logApiError("admin.notifications.list", error, request);
    return jsonWithRequestId({ error: "Failed to load notifications" }, { status: 500 }, request);
  }
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
    const parsed = notificationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
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

    return jsonWithRequestId({ success: true, notification }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.notifications.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create notification" }, { status: 500 }, request);
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
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.notification.findUnique({ where: { id: data.id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Notification not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true, notification }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.notifications.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update notification" }, { status: 500 }, request);
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
  const parsedQuery = deleteQuerySchema.safeParse({ id: searchParams.get("id") });
  if (!parsedQuery.success) {
    return jsonWithRequestId({ error: "Notification id is required" }, { status: 400 }, request);
  }
  const { id } = parsedQuery.data;

  try {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Notification not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.notifications.delete", error, request, { notificationId: id, userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete notification" }, { status: 500 }, request);
  }
}
