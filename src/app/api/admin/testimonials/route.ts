import { NextRequest } from "next/server";
import { TestimonialStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { invalidateCache, invalidateCacheByPrefix } from "../../../../lib/runtime-cache";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: z.nativeEnum(TestimonialStatus),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("testimonials.view");
  if (response) {
    return response;
  }

  try {
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

    return jsonWithRequestId(
      {
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
      },
      undefined,
      request,
    );
  } catch (error) {
    logApiError("admin.testimonials.list", error, request);
    return jsonWithRequestId({ error: "Failed to load testimonials" }, { status: 500 }, request);
  }
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
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.testimonial.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Testimonial not found" }, { status: 404 }, request);
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedAt: data.status === "APPROVED" ? new Date() : null,
      },
    });

    invalidateCacheByPrefix("public_testimonials_cache:");
    invalidateCache("social_proof_stats_cache");

    await writeAuditLog({
      actorUserId: user.id,
      action: "testimonial.moderated",
      entity: "testimonial",
      entityId: testimonial.id,
      oldValue: existing,
      newValue: testimonial,
      request,
    });

    return jsonWithRequestId({ success: true, testimonial }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.testimonials.moderate", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update testimonial" }, { status: 500 }, request);
  }
}
