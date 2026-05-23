import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const markReadSchema = z.object({
  notificationId: z.string().min(1),
});

const preferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  browserPushEnabled: z.boolean().optional(),
});

function getAllowedAudiences(accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI") {
  if (accessLevel === "ALUMNI") {
    return ["ALUMNI", "ALL_ACTIVE"];
  }
  if (accessLevel === "FULL") {
    return ["PRE_ARRIVAL", "FULL", "ALL_ACTIVE"];
  }
  if (accessLevel === "PRE_ARRIVAL") {
    return ["PRE_ARRIVAL", "ALL_ACTIVE"];
  }
  return [];
}

function notificationWhereForStudent(student: {
  id: string;
  batchId: string | null;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
}) {
  return {
    publishedAt: { not: null },
    OR: [
      { audience: { in: getAllowedAudiences(student.accessLevel) as ("PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE")[] } },
      { audience: "INDIVIDUAL" as const, studentId: student.id },
      ...(student.batchId ? [{ batchId: student.batchId }] : []),
    ],
  };
}

export async function GET(request: NextRequest) {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: notificationWhereForStudent(student),
      include: {
        receipts: {
          where: { studentId: student.id },
          select: { id: true, readAt: true },
          take: 1,
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    const unreadCount = notifications.filter((item) => !item.receipts[0]?.readAt).length;
    const currentStudent = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        emailNotificationsEnabled: true,
        browserPushEnabled: true,
      },
    });

    return jsonWithRequestId(
      {
        preferences: {
          emailNotificationsEnabled: currentStudent?.emailNotificationsEnabled ?? true,
          browserPushEnabled: currentStudent?.browserPushEnabled ?? false,
        },
        notifications: notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          audience: item.audience,
          batchId: item.batchId,
          studentId: item.studentId,
          actionUrl: item.actionUrl,
          publishedAt: item.publishedAt,
          createdAt: item.createdAt,
          readAt: item.receipts[0]?.readAt || null,
        })),
        unreadCount,
      },
      undefined,
      request,
    );
  } catch (error) {
    logApiError("app.notifications.list", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to load notifications" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const body = await request.json();

    if ("emailNotificationsEnabled" in body || "browserPushEnabled" in body) {
      const preferences = preferencesSchema.parse(body);
      const updated = await prisma.student.update({
        where: { id: student.id },
        data: {
          ...(preferences.emailNotificationsEnabled !== undefined
            ? { emailNotificationsEnabled: preferences.emailNotificationsEnabled }
            : {}),
          ...(preferences.browserPushEnabled !== undefined
            ? { browserPushEnabled: preferences.browserPushEnabled }
            : {}),
        },
        select: {
          emailNotificationsEnabled: true,
          browserPushEnabled: true,
        },
      });

      return jsonWithRequestId({ success: true, preferences: updated }, undefined, request);
    }

    const { notificationId } = markReadSchema.parse(body);

    const existing = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        ...notificationWhereForStudent(student),
      },
      select: { id: true },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Notification not found" }, { status: 404 }, request);
    }

    const receipt = await prisma.notificationReceipt.upsert({
      where: {
        notificationId_studentId: {
          notificationId,
          studentId: student.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId,
        studentId: student.id,
        readAt: new Date(),
      },
    });

    return jsonWithRequestId({ success: true, receipt }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.notifications.update", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to update notification settings" }, { status: 500 }, request);
  }
}
