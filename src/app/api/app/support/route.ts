import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const supportSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(3000),
});

export async function GET(request: NextRequest) {
  const { user, student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!user || !student || response) {
    return response;
  }

  try {
    const tickets = await prisma.lead.findMany({
      where: {
        email: user.email,
        source: "student_portal_support",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        course: true,
        message: true,
        status: true,
        notes: true,
        followUpAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonWithRequestId(
      {
        tickets: tickets.map((ticket) => {
          const subjectLine =
            ticket.message
              ?.split("\n")
              .find((line) => line.toLowerCase().startsWith("subject:"))
              ?.replace(/^subject:\s*/i, "")
              .trim() || "Student portal support";

          return {
            id: ticket.id,
            subject: subjectLine,
            course: ticket.course,
            status: ticket.status,
            notes: ticket.notes,
            followUpAt: ticket.followUpAt,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          };
        }),
      },
      undefined,
      request,
    );
  } catch (error) {
    logApiError("app.support.list", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to load support requests" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!user || !student || response) {
    return response;
  }

  try {
    const payload = await request.json().catch(() => null);
    const result = supportSchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const currentStudent = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        phone: true,
        enrolledCourse: true,
        accessLevel: true,
        paymentStatus: true,
        batch: {
          select: {
            name: true,
            course: { select: { name: true } },
          },
        },
      },
    });

    const courseName = currentStudent?.batch?.course?.name || currentStudent?.enrolledCourse || "Student portal";
    const lead = await prisma.lead.create({
      data: {
        name: user.displayName || user.email,
        email: user.email,
        phone: currentStudent?.phone || "",
        source: "student_portal_support",
        course: `${courseName}${currentStudent?.batch?.name ? ` - ${currentStudent.batch.name}` : ""}`,
        message: [
          `Subject: ${result.data.subject}`,
          "",
          result.data.message,
          "",
          `Student ID: ${student.id}`,
          `Access: ${currentStudent?.accessLevel || student.accessLevel}`,
          `Payment: ${currentStudent?.paymentStatus || student.paymentStatus}`,
        ].join("\n"),
        status: "NEW",
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.support_ticket_created",
      entity: "lead",
      entityId: lead.id,
      newValue: {
        leadId: lead.id,
        subject: result.data.subject,
        source: lead.source,
      },
      request,
    });

    return jsonWithRequestId({ success: true, ticketId: lead.id }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.support.create", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to submit support request" }, { status: 500 }, request);
  }
}
