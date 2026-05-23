import prisma from "@/lib/prisma";

export async function assignDemoStudentToBatch() {
  const user = await prisma.user.findUnique({
    where: { email: "student@test.com" },
  });

  const batch = await prisma.batch.findFirst({
    where: { name: "May 2026 Batch" },
  });

  if (!user || !batch) {
    return { updated: false, reason: "User or batch not found" };
  }

  await prisma.student.update({
    where: { userId: user.id },
    data: {
      batchId: batch.id,
      enrolledCourse: "200-Hour Yoga Teacher Training",
      enrollmentDate: new Date(),
    },
  });

  return { updated: true };
}
