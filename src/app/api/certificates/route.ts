import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateCertificateId } from "@/lib/certificate";
import { canManageStudentCertificates } from "@/lib/certificate-access";
import { getCertificateEligibility } from "@/lib/certificate-eligibility";
import { getCurrentUser, requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const createCertificateSchema = z.object({
  studentId: z.string().trim().min(1).max(120),
  courseSlug: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return jsonWithRequestId({ error: "Unauthorized" }, { status: 401 }, request);
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")?.trim();
    const studentEmail = searchParams.get("email")?.trim().toLowerCase();

    let student;

    if (studentId) {
      student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          certificates: true,
        },
      });
    } else if (studentEmail) {
      student = await prisma.student.findFirst({
        where: { user: { email: studentEmail } },
        include: {
          user: true,
          certificates: true,
        },
      });
    } else {
      student = await prisma.student.findUnique({
        where: { userId: currentUser.id },
        include: {
          user: true,
          certificates: true,
        },
      });
    }

    if (!student) {
      return jsonWithRequestId({ error: "Student not found" }, { status: 404 }, request);
    }

    const isOwner = student.userId === currentUser.id;
    const isPrivileged = canManageStudentCertificates(currentUser);
    if (!isOwner && !isPrivileged) {
      return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
    }

    const certificates = await prisma.certificate.findMany({
      where: { studentId: student.id },
      orderBy: { issuedAt: "desc" },
    });

    const eligibility = await getCertificateEligibility(student.id);

    return jsonWithRequestId({ certificates, eligibility }, undefined, request);
  } catch (error) {
    logApiError("certificates.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch certificates" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  try {
    const { user, response } = await requirePermission("certificates.issue");
    if (!user || response) {
      return response;
    }

    const parsed = createCertificateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId(
        { error: "studentId and courseSlug are required" },
        { status: 400 },
        request,
      );
    }
    const { studentId, courseSlug } = parsed.data;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return jsonWithRequestId({ error: "Student not found" }, { status: 404 }, request);
    }

    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
    });

    if (!course) {
      return jsonWithRequestId({ error: "Course not found" }, { status: 404 }, request);
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: {
        studentId: student.id,
        course: course.name,
      },
    });

    if (existing) {
      return jsonWithRequestId({ certificate: existing, message: "Certificate already exists" }, undefined, request);
    }

    const eligibility = await getCertificateEligibility(student.id);
    if (!eligibility.eligible) {
      return jsonWithRequestId(
        {
          error: "Student is not eligible for certificate issuance",
          eligibility,
        },
        { status: 400 },
        request,
      );
    }

    const year = new Date().getFullYear();
    const certificateId = generateCertificateId(courseSlug, year);

    const certificate = await prisma.certificate.create({
      data: {
        studentId: student.id,
        certificateId,
        course: course.name,
        status: "ISSUED",
        issuedAt: new Date(),
      },
    });

    await prisma.student.update({
      where: { id: student.id },
      data: {
        certificateIssued: true,
        certificateId: certificate.id,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "certificate.issued",
      entity: "certificate",
      entityId: certificate.id,
      newValue: certificate,
      request,
    });

    return jsonWithRequestId({
      success: true,
      certificate,
      eligibility,
    }, undefined, request);
  } catch (error) {
    logApiError("certificates.create", error, request);
    return jsonWithRequestId({ error: "Failed to create certificate" }, { status: 500 }, request);
  }
}
