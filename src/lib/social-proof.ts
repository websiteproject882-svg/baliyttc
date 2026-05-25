import prisma from "@/lib/prisma";
import { fallbackSocialProofStats, socialProofSchema, type SocialProofStats } from "@/lib/social-proof-shared";
import { getCached, setCached } from "./runtime-cache";

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

function normalizeDisplayStats(stats: SocialProofStats): SocialProofStats {
  return {
    totalGraduates:
      stats.totalGraduates >= 100 ? stats.totalGraduates : fallbackSocialProofStats.totalGraduates,
    yearsExperience:
      stats.yearsExperience > 0 ? stats.yearsExperience : fallbackSocialProofStats.yearsExperience,
    averageRating:
      stats.averageRating >= 4 ? stats.averageRating : fallbackSocialProofStats.averageRating,
    totalReviews:
      stats.totalReviews >= 10 ? stats.totalReviews : fallbackSocialProofStats.totalReviews,
    countries:
      stats.countries >= 5 ? stats.countries : fallbackSocialProofStats.countries,
    trainingHours:
      stats.trainingHours >= 1000 ? stats.trainingHours : fallbackSocialProofStats.trainingHours,
    certifiedTeachers:
      stats.certifiedTeachers >= 100 ? stats.certifiedTeachers : fallbackSocialProofStats.certifiedTeachers,
  };
}

export async function getSocialProofStats() {
  const cacheKey = "social_proof_stats_cache";
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const [computedStats, overrideRow] = await Promise.all([
    getComputedSocialProofStats(),
    prisma.siteSetting.findUnique({ where: { key: SOCIAL_PROOF_SETTINGS_KEY } }),
  ]);
  const parsedOverrides = socialProofSchema.safeParse(overrideRow?.value);
  const displayStats = parsedOverrides.success ? parsedOverrides.data : fallbackSocialProofStats;
  
  const result = {
    stats: normalizeDisplayStats(displayStats),
    computedStats,
  };

  setCached(cacheKey, result, 120); // 2 minutes
  return result;
}
