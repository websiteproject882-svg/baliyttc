import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCertificatePDF } from "@/lib/certificate";
import { canManageStudentCertificates } from "@/lib/certificate-access";
import { getCurrentUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return jsonWithRequestId({ error: "Unauthorized" }, { status: 401 }, request);
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!certificate) {
      return jsonWithRequestId({ error: "Certificate not found" }, { status: 404 }, request);
    }

    const isOwner = certificate.student.userId === currentUser.id;
    const isPrivileged = canManageStudentCertificates(currentUser);
    if (!isOwner && !isPrivileged) {
      return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
    }

    const siteSettings = await getSiteSettings();

    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.student.user.displayName || certificate.student.user.email || "Student",
      courseName: certificate.course,
      courseHours: parseInt(certificate.course.replace(/\D/g, "")) || 200,
      completionDate: certificate.issuedAt || new Date(),
      certificateId: certificate.certificateId,
      schoolName: siteSettings.general.schoolName,
      schoolLocation: siteSettings.general.address,
      instructorName: "Vivek Kalura",
      templateImageUrl: siteSettings.assets.certificateTemplateUrl || undefined,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
      },
    });
  } catch (error) {
    logApiError("certificates.download", error, request, { certificateId: params.id });
    return jsonWithRequestId({ error: "Failed to generate certificate" }, { status: 500 }, request);
  }
}
