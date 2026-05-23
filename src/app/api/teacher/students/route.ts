import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { currentUserHasPermission, requireStaffUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";
const MAX_BATCH_ID_LENGTH = 120;

type TeacherStudent = {
  id: string;
  user: {
    displayName: string | null;
    email: string;
  };
  phone: string | null;
  batch: {
    name: string;
    course: {
      name: string;
    };
  } | null;
  completedHours: number;
  totalHours: number;
  certificateIssued: boolean;
  enrollmentDate: Date | null;
};

export async function GET(request: NextRequest) {
  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "students.view")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId")?.trim();

    if (batchId && batchId.length > MAX_BATCH_ID_LENGTH) {
      return jsonWithRequestId({ error: "Invalid batchId" }, { status: 400 }, request);
    }

    const where: Record<string, unknown> = {
      accessLevel: { in: ["PRE_ARRIVAL", "FULL"] },
    };
    if (batchId) where.batchId = batchId;

    const students = (await prisma.student.findMany({
      where,
      include: {
        user: {
          select: { displayName: true, email: true },
        },
        batch: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as TeacherStudent[];

    return jsonWithRequestId({
      students: students.map((s) => ({
        id: s.id,
        name: s.user.displayName || s.user.email,
        email: s.user.email,
        phone: s.phone,
        course: s.batch?.course?.name,
        batch: s.batch?.name,
        progress: s.totalHours > 0 ? Math.min(Math.round((s.completedHours / s.totalHours) * 100), 100) : 0,
        certificateIssued: s.certificateIssued,
        enrolledAt: s.enrollmentDate,
      })),
    }, undefined, request);
  } catch (error) {
    logApiError("teacher.students.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch students" }, { status: 500 }, request);
  }
}
