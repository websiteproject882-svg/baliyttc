import { z } from "zod";

export const socialProofSchema = z.object({
  totalGraduates: z.coerce.number().int().min(0),
  yearsExperience: z.coerce.number().int().min(0),
  averageRating: z.coerce.number().min(0).max(5),
  totalReviews: z.coerce.number().int().min(0),
  countries: z.coerce.number().int().min(0),
  trainingHours: z.coerce.number().int().min(0),
  certifiedTeachers: z.coerce.number().int().min(0),
});

export type SocialProofStats = z.infer<typeof socialProofSchema>;

export const fallbackSocialProofStats: SocialProofStats = {
  totalGraduates: 2500,
  yearsExperience: 12,
  averageRating: 4.9,
  totalReviews: 600,
  countries: 70,
  trainingHours: 50000,
  certifiedTeachers: 2200,
};
