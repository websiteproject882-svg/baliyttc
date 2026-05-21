import prisma from "@/lib/prisma";

async function updateStudent() {
  // Get user by email
  const user = await prisma.user.findUnique({
    where: { email: "student@test.com" },
  });

  const batch = await prisma.batch.findFirst({
    where: { name: "May 2026 Batch" },
  });

  if (user && batch) {
    await prisma.student.update({
      where: { userId: user.id },
      data: {
        batchId: batch.id,
        enrolledCourse: "200-Hour Yoga Teacher Training",
        enrollmentDate: new Date(),
      },
    });
    console.log("Student updated with batch info");
  } else {
    console.log("User or batch not found:", { user, batch });
  }
}

updateStudent().then(() => process.exit(0));
