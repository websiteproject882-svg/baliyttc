import prisma from "@/lib/prisma";

export type CertificateEligibility = {
  eligible: boolean;
  reasons: string[];
  completedHours: number;
  totalHours: number;
  modulesCompleted: number;
  modulesRequired: number;
  completionPercent: number;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
};

export async function getCertificateEligibility(studentId: string): Promise<CertificateEligibility> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      accessLevel: true,
      completedHours: true,
      totalHours: true,
      batch: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const [courseModules, completedProgress] = student.batch?.courseId
    ? await Promise.all([
        prisma.module.findMany({
          where: { courseId: student.batch.courseId },
          select: { id: true },
        }),
        prisma.moduleProgress.findMany({
          where: { studentId, completed: true },
          select: { moduleId: true },
        }),
      ])
    : [[], []];

  const modulesRequired = courseModules.length;
  const courseModuleIds = new Set(courseModules.map((module) => module.id));
  const modulesCompleted = completedProgress.filter((item) => courseModuleIds.size === 0 || courseModuleIds.has(item.moduleId)).length;
  const completionPercent =
    student.totalHours > 0
      ? Math.min(100, Math.round((student.completedHours / student.totalHours) * 100))
      : 0;

  const reasons: string[] = [];

  if (!["FULL", "ALUMNI"].includes(student.accessLevel)) {
    reasons.push("Full course access is required before certification.");
  }

  if (student.completedHours < student.totalHours) {
    reasons.push(`Complete all required hours (${student.completedHours}/${student.totalHours}).`);
  }

  if (modulesRequired > 0 && modulesCompleted < modulesRequired) {
    reasons.push(`Complete all course modules (${modulesCompleted}/${modulesRequired}).`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    completedHours: student.completedHours,
    totalHours: student.totalHours,
    modulesCompleted,
    modulesRequired,
    completionPercent,
    accessLevel: student.accessLevel,
  };
}
