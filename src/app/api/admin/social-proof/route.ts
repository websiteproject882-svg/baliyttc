import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, writeAuditLog } from "@/lib/authz";

const SETTINGS_KEY = "social_proof_overrides";

const socialProofSchema = z.object({
  totalGraduates: z.number().int().min(0),
  yearsExperience: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  totalReviews: z.number().int().min(0),
  countries: z.number().int().min(0),
  trainingHours: z.number().int().min(0),
  certifiedTeachers: z.number().int().min(0),
});

export async function GET() {
  try {
    const [
      totalGraduates,
      reviewStats,
      countries,
      trainingHours,
      certifiedTeachers,
    ] = await Promise.all([
      prisma.certificate.count({
        where: { status: "ISSUED" },
      }),
      prisma.testimonial.aggregate({
        where: { status: "APPROVED" },
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.student.findMany({
        where: { nationality: { not: null } },
        select: { nationality: true },
        distinct: ["nationality"],
      }),
      prisma.student.aggregate({
        _sum: { completedHours: true },
      }),
      prisma.certificate.count({
        where: { status: "ISSUED" },
      }),
    ]);

    const computedStats = {
      totalGraduates,
      yearsExperience: 12,
      averageRating: Number((reviewStats._avg.rating || 0).toFixed(1)),
      totalReviews: reviewStats._count.id,
      countries: countries.length,
      trainingHours: Number(trainingHours?._sum?.completedHours) || 0,
      certifiedTeachers,
    };
    const overrideRow = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
    const parsedOverrides = socialProofSchema.safeParse(overrideRow?.value);
    const stats = parsedOverrides.success ? parsedOverrides.data : computedStats;

    return NextResponse.json({ stats, computedStats });
  } catch (error) {
    console.error("Social proof fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch social proof" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const stats = socialProofSchema.parse(await request.json());
    const existing = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
    await prisma.siteSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: stats },
      update: { value: stats },
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "social_proof.updated",
      entity: "site_settings",
      entityId: SETTINGS_KEY,
      oldValue: existing?.value,
      newValue: stats,
      request,
    });

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Social proof update error:", error);
    return NextResponse.json({ error: "Failed to update social proof" }, { status: 500 });
  }
}
