import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const schema = z.object({
  enrollmentId: z.string().min(1),
  accessLevel: z.enum(["NONE", "PRE_ARRIVAL", "FULL", "ALUMNI"]),
});

function paymentStatusForAccess(accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI") {
  switch (accessLevel) {
    case "PRE_ARRIVAL":
      return "DEPOSIT_PAID";
    case "FULL":
    case "ALUMNI":
      return "FULL_PAID";
    default:
      return "PENDING";
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  try {
    const data = schema.parse(await request.json());

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        student: true,
        user: true,
      },
    });

    if (!enrollment) {
      return jsonWithRequestId({ error: "Enrollment not found" }, { status: 404 }, request);
    }

    const targetPaymentStatus = paymentStatusForAccess(data.accessLevel);

    const updatedStudent = enrollment.student
      ? await prisma.student.update({
          where: { id: enrollment.student.id },
          data: {
            accessLevel: data.accessLevel,
            paymentStatus: targetPaymentStatus,
          },
        })
      : await prisma.student.create({
          data: {
            userId: enrollment.userId,
            accessLevel: data.accessLevel,
            paymentStatus: targetPaymentStatus,
            phone: enrollment.phone,
          },
        });

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        studentId: updatedStudent.id,
        accessLevel: data.accessLevel,
        paymentStatus: targetPaymentStatus,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.access_updated",
      entity: "enrollment",
      entityId: enrollment.id,
      oldValue: {
        enrollmentAccessLevel: enrollment.accessLevel,
        studentAccessLevel: enrollment.student?.accessLevel ?? null,
        paymentStatus: enrollment.paymentStatus,
      },
      newValue: {
        enrollmentAccessLevel: updatedEnrollment.accessLevel,
        studentAccessLevel: updatedStudent.accessLevel,
        paymentStatus: updatedEnrollment.paymentStatus,
      },
      request,
    });

    return jsonWithRequestId({
      success: true,
      enrollment: updatedEnrollment,
      student: updatedStudent,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }

    logApiError("admin.students.access", error, request);
    return jsonWithRequestId({ error: "Failed to update student access" }, { status: 500 }, request);
  }
}
