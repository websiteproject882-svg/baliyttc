"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackSocialProofStats, type SocialProofStats } from "@/lib/social-proof-shared";

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(value);
}

export function useSocialProof() {
  const [stats, setStats] = useState<SocialProofStats>(fallbackSocialProofStats);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/social-proof", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { stats?: SocialProofStats };
        if (!cancelled && data.stats) {
          setStats(data.stats);
        }
      } catch {
        // Keep static defaults when admin-backed stats are unavailable.
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      stats,
      compactTotalGraduates: compactNumber(stats.totalGraduates),
      compactCertifiedTeachers: compactNumber(stats.certifiedTeachers),
      compactTrainingHours: compactNumber(stats.trainingHours),
      ratingLabel: `${stats.averageRating.toFixed(1)} / 5`,
      reviewLabel: `${stats.averageRating.toFixed(1)} - ${stats.totalReviews}+ Reviews`,
    }),
    [stats],
  );
}
