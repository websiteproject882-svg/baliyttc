import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const ALLOWED_TEACHER_DASHBOARD_ROLES = new Set([
  "TEACHER",
  "SUPER_ADMIN",
  "ADMIN",
  "STUDENT_MANAGER",
  "COURSE_MANAGER",
]);

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (!ALLOWED_TEACHER_DASHBOARD_ROLES.has(user.role)) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const [
      upcomingBatches,
      totalStudents,
      scheduleEntries,
      recentAnnouncements,
    ] = await Promise.all([
      // Get batches where teacher is assigned
      prisma.batch.findMany({
        where: {
          startDate: { gte: today },
          status: { in: ["OPEN", "FULL"] },
        },
        include: {
          course: true,
        },
        orderBy: { startDate: "asc" },
        take: 5,
      }),

      // Get total enrolled students
      prisma.student.count({
        where: {
          accessLevel: { in: ["PRE_ARRIVAL", "FULL"] },
        },
      }),

      // Get schedule for current/next batch
      prisma.scheduleEntry.findMany({
        where: {
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
        include: {
          batch: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { date: "asc" },
        take: 7,
      }),

      // Get recent announcements
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return jsonWithRequestId({
      upcomingBatches,
      totalStudents,
      scheduleEntries,
      recentAnnouncements,
    }, undefined, request);
  } catch (error) {
    logApiError("teacher.dashboard", error, request);
    return jsonWithRequestId({ error: "Failed to load teacher dashboard" }, { status: 500 }, request);
  }
}
