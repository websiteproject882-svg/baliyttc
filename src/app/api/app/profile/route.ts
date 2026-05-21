import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  displayName: z.string().max(120).optional().or(z.literal("")),
  photoURL: z
    .string()
    .max(250000)
    .refine((value) => !value || value.startsWith("data:image/") || /^https?:\/\//.test(value), {
      message: "Photo must be an image upload or URL",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  nationality: z.string().max(100).optional().or(z.literal("")),
  dietaryRequirements: z.string().max(500).optional().or(z.literal("")),
  yogaExperience: z.string().max(1000).optional().or(z.literal("")),
  emergencyContact: z.string().max(500).optional().or(z.literal("")),
});

export async function GET() {
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

  return NextResponse.json({
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
  });
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
    const parsed = profileSchema.parse(await request.json());
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

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH app profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
