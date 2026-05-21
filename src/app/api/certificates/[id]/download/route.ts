import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCertificatePDF } from "@/lib/certificate";
import { getCurrentUser } from "@/lib/authz";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const isOwner = certificate.student.userId === currentUser.id;
    const isPrivileged = ["ADMIN", "SUPER_ADMIN", "STUDENT_MANAGER"].includes(currentUser.role);
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.student.user.displayName || certificate.student.user.email || "Student",
      courseName: certificate.course,
      courseHours: parseInt(certificate.course.replace(/\D/g, "")) || 200,
      completionDate: certificate.issuedAt || new Date(),
      certificateId: certificate.certificateId,
      schoolName: "Bali Yoga Teacher Training Center",
      schoolLocation: "Ubud, Bali, Indonesia",
      instructorName: "Vivek Kalura",
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate download error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
