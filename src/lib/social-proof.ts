import prisma from "@/lib/prisma";
import { fallbackSocialProofStats, socialProofSchema, type SocialProofStats } from "@/lib/social-proof-shared";

export { fallbackSocialProofStats, socialProofSchema, type SocialProofStats } from "@/lib/social-proof-shared";

export const SOCIAL_PROOF_SETTINGS_KEY = "social_proof_overrides";

export async function getComputedSocialProofStats(): Promise<SocialProofStats> {
  const [totalGraduates, reviewStats, countries, trainingHours, certifiedTeachers] = await Promise.all([
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

  return {
    totalGraduates,
    yearsExperience: fallbackSocialProofStats.yearsExperience,
    averageRating: Number((reviewStats._avg.rating || fallbackSocialProofStats.averageRating).toFixed(1)),
    totalReviews: reviewStats._count.id || fallbackSocialProofStats.totalReviews,
    countries: countries.length || fallbackSocialProofStats.countries,
    trainingHours: Number(trainingHours?._sum?.completedHours) || fallbackSocialProofStats.trainingHours,
    certifiedTeachers,
  };
}

export async function getSocialProofStats() {
  const [computedStats, overrideRow] = await Promise.all([
    getComputedSocialProofStats(),
    prisma.siteSetting.findUnique({ where: { key: SOCIAL_PROOF_SETTINGS_KEY } }),
  ]);
  const parsedOverrides = socialProofSchema.safeParse(overrideRow?.value);
  return {
    stats: parsedOverrides.success ? parsedOverrides.data : fallbackSocialProofStats,
    computedStats,
  };
}
