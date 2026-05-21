import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const testimonialSchema = z.object({
  rating: z.number().int().min(1).max(5),
  quote: z.string().min(30).max(3000),
  location: z.string().max(120).optional().or(z.literal("")),
  courseName: z.string().max(160).optional().or(z.literal("")),
  graduationYear: z.number().int().min(2000).max(2100).optional().nullable(),
});

export async function GET() {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  const testimonials = await prisma.testimonial.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ testimonials });
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, student, response } = await requireStudentUser({ minimumAccess: "FULL" });
  if (!user || !student || response) {
    return response;
  }

  try {
    const data = testimonialSchema.parse(await request.json());
    const testimonial = await prisma.testimonial.create({
      data: {
        studentId: student.id,
        rating: data.rating,
        quote: data.quote,
        location: data.location || null,
        courseName: data.courseName || student.enrolledCourse || null,
        graduationYear: data.graduationYear ?? new Date().getFullYear(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.testimonial_submitted",
      entity: "testimonial",
      entityId: testimonial.id,
      newValue: testimonial,
      request,
    });

    return jsonWithRequestId({ success: true, testimonial }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.testimonials.create", error, request);
    return jsonWithRequestId({ error: "Failed to submit testimonial" }, { status: 500 }, request);
  }
}
