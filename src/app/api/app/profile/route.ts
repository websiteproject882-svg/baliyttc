import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  displayName: z.string().trim().max(120).optional().or(z.literal("")),
  photoURL: z
    .string()
    .trim()
    .max(250000)
    .refine((value) => !value || value.startsWith("data:image/") || /^https:\/\//.test(value), {
      message: "Photo must be an image upload or URL",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  nationality: z.string().trim().max(100).optional().or(z.literal("")),
  dietaryRequirements: z.string().trim().max(500).optional().or(z.literal("")),
  yogaExperience: z.string().trim().max(1000).optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const { user, student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!user || !student || response) {
    return response;
  }

  const current = await prisma.student.findUnique({
    where: { id: student.id },
    select: {
      phone: true,
      nationality: true,
      dietaryRequirements: true,
      yogaExperience: true,
      emergencyContact: true,
      enrolledCourse: true,
      enrollmentDate: true,
      paymentStatus: true,
      accessLevel: true,
      batch: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          course: { select: { name: true } },
        },
      },
    },
  });

  return jsonWithRequestId({
    email: user.email,
    displayName: user.displayName || "",
    photoURL: (await prisma.user.findUnique({
      where: { id: user.id },
      select: { photoURL: true },
    }))?.photoURL || "",
    phone: current?.phone || "",
    nationality: current?.nationality || "",
    dietaryRequirements: current?.dietaryRequirements || "",
    yogaExperience: current?.yogaExperience || "",
    emergencyContact: current?.emergencyContact || "",
    enrolledCourse: current?.batch?.course?.name || current?.enrolledCourse || "",
    batchName: current?.batch?.name || "",
    enrollmentDate: current?.enrollmentDate || null,
    paymentStatus: current?.paymentStatus || "",
    accessLevel: current?.accessLevel || "NONE",
  }, undefined, request);
}

export async function PATCH(request: NextRequest) {
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
    const result = profileSchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const parsed = result.data;
    const existing = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        phone: true,
        nationality: true,
        dietaryRequirements: true,
        yogaExperience: true,
        emergencyContact: true,
      },
    });
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, photoURL: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: parsed.displayName || null,
        photoURL: parsed.photoURL || null,
      },
    });

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        phone: parsed.phone || null,
        nationality: parsed.nationality || null,
        dietaryRequirements: parsed.dietaryRequirements || null,
        yogaExperience: parsed.yogaExperience || null,
        emergencyContact: parsed.emergencyContact || null,
      },
      select: {
        phone: true,
        nationality: true,
        dietaryRequirements: true,
        yogaExperience: true,
        emergencyContact: true,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.profile_updated",
      entity: "student",
      entityId: student.id,
      oldValue: { ...(existing || {}), user: existingUser || {} },
      newValue: { ...updated, user: { displayName: parsed.displayName || null, photoURL: parsed.photoURL || null } },
      request,
    });

    return jsonWithRequestId({ success: true, profile: updated }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.profile", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to save profile" }, { status: 500 }, request);
  }
}
