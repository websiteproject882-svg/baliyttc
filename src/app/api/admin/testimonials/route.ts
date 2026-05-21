import { NextRequest, NextResponse } from "next/server";
import { TestimonialStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(TestimonialStatus),
});

export async function GET() {
  const { response } = await requirePermission("testimonials.view");
  if (response) {
    return response;
  }

  const testimonials = await prisma.testimonial.findMany({
    include: {
      student: {
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    testimonials: testimonials.map((item) => ({
      id: item.id,
      rating: item.rating,
      quote: item.quote,
      location: item.location,
      courseName: item.courseName,
      graduationYear: item.graduationYear,
      status: item.status,
      approvedAt: item.approvedAt,
      createdAt: item.createdAt,
      student: {
        id: item.student.id,
        name: item.student.user.displayName || item.student.user.email,
        email: item.student.user.email,
      },
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("testimonials.approve");
  if (!user || response) {
    return response;
  }

  try {
    const data = updateSchema.parse(await request.json());
    const existing = await prisma.testimonial.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedAt: data.status === "APPROVED" ? new Date() : null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "testimonial.moderated",
      entity: "testimonial",
      entityId: testimonial.id,
      oldValue: existing,
      newValue: testimonial,
      request,
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH admin testimonial error:", error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}
