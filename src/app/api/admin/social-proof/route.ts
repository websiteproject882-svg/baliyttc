import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const SETTINGS_KEY = "social_proof_overrides";

const socialProofSchema = z.object({
  totalGraduates: z.coerce.number().int().min(0),
  yearsExperience: z.coerce.number().int().min(0),
  averageRating: z.coerce.number().min(0).max(5),
  totalReviews: z.coerce.number().int().min(0),
  countries: z.coerce.number().int().min(0),
  trainingHours: z.coerce.number().int().min(0),
  certifiedTeachers: z.coerce.number().int().min(0),
});

export async function GET(request: NextRequest) {
  const { response } = await requireAdminUser();
  if (response) return response;

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

    return jsonWithRequestId({ stats, computedStats }, undefined, request);
  } catch (error) {
    logApiError("admin.socialProof.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch social proof" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

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

    return jsonWithRequestId({ success: true, stats }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.socialProof.update", error, request, { userId: user!.id });
    return jsonWithRequestId({ error: "Failed to update social proof" }, { status: 500 }, request);
  }
}
