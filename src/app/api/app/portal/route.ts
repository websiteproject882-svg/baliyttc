import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireStudentUser } from "@/lib/authz";
import { getCertificateEligibility } from "@/lib/certificate-eligibility";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const DEFAULT_TASKS = [
  { taskKey: "read_manual", taskTitle: "Read the course manual introduction" },
  { taskKey: "watch_welcome_video", taskTitle: "Watch the welcome video from lead teachers" },
  { taskKey: "review_packing_list", taskTitle: "Review the Bali packing checklist" },
  { taskKey: "review_visa_guide", taskTitle: "Review the Bali visa and arrival guide" },
  { taskKey: "complete_profile", taskTitle: "Complete your profile information" },
  { taskKey: "confirm_dietary_needs", taskTitle: "Confirm dietary needs and emergency contact" },
  { taskKey: "join_whatsapp", taskTitle: "Join the batch WhatsApp group" },
];

export async function GET(request: NextRequest) {
  const { user, student, response } = await requireStudentUser();
  if (!user || !student || response) {
    return response;
  }

  try {
    const fullStudent = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      user: {
        select: {
          email: true,
          displayName: true,
        },
      },
      batch: {
        include: {
          course: true,
        },
      },
      progress: {
        orderBy: { createdAt: "asc" },
      },
      certificates: {
        orderBy: { issuedAt: "desc" },
      },
      taskProgress: {
        orderBy: { createdAt: "asc" },
      },
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
    },
  });

    if (!fullStudent) {
      return jsonWithRequestId({ error: "Student not found" }, { status: 404 }, request);
    }

  const paidEnrollment = fullStudent.enrollments.find((enrollment) =>
    ["DEPOSIT_PAID", "FULL_PAID"].includes(enrollment.paymentStatus),
  );
  const activeBatchId = fullStudent.batchId || paidEnrollment?.batchId || null;
  const activeBatch =
    fullStudent.batch ||
    (activeBatchId
      ? await prisma.batch.findUnique({
          where: { id: activeBatchId },
          include: { course: true },
        })
      : null);

  const taskKeys = new Set(fullStudent.taskProgress.map((task) => task.taskKey));
  const missingTasks = DEFAULT_TASKS.filter((task) => !taskKeys.has(task.taskKey));

  if (missingTasks.length > 0) {
    await prisma.taskProgress.createMany({
      data: missingTasks.map((task) => ({
        studentId: fullStudent.id,
        taskKey: task.taskKey,
        taskTitle: task.taskTitle,
      })),
      skipDuplicates: true,
    });
  }

  const refreshedTasks = await prisma.taskProgress.findMany({
    where: { studentId: fullStudent.id },
    orderBy: { createdAt: "asc" },
  });

  if (activeBatch?.courseId) {
    const modules = await prisma.module.findMany({
      where: { courseId: activeBatch.courseId },
      orderBy: { order: "asc" },
    });

    const progressKeys = new Set(fullStudent.progress.map((item) => item.moduleId));
    const missingModules = modules.filter((module) => !progressKeys.has(module.id));
    if (missingModules.length > 0) {
      await prisma.moduleProgress.createMany({
        data: missingModules.map((module) => ({
          studentId: fullStudent.id,
          moduleId: module.id,
          moduleTitle: module.title,
        })),
        skipDuplicates: true,
      });
    }
  }

  const courseModules = activeBatch?.courseId
    ? await prisma.module.findMany({
        where: { courseId: activeBatch.courseId },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          hours: true,
        },
      })
    : [];

  const refreshedProgressRows = await prisma.moduleProgress.findMany({
    where: { studentId: fullStudent.id },
    orderBy: { createdAt: "asc" },
  });
  const progressByModuleId = new Map(refreshedProgressRows.map((item) => [item.moduleId, item]));
  const refreshedProgress = courseModules.length
    ? courseModules.map((module) => {
        const row = progressByModuleId.get(module.id);
        return {
          id: row?.id || module.id,
          moduleId: module.id,
          moduleTitle: row?.moduleTitle || module.title,
          completed: row?.completed || false,
          completedAt: row?.completedAt || null,
          notes: row?.notes || "",
          hours: module.hours ?? 0,
        };
      })
    : refreshedProgressRows.map((row) => ({
        id: row.id,
        moduleId: row.moduleId,
        moduleTitle: row.moduleTitle,
        completed: row.completed,
        completedAt: row.completedAt,
        notes: row.notes || "",
        hours: 0,
      }));
  const derivedTotalHours =
    courseModules.reduce((sum, module) => sum + (module.hours ?? 0), 0) || fullStudent.totalHours;
  const derivedCompletedHours = refreshedProgress.reduce(
    (sum, item) => (item.completed ? sum + (item.hours ?? 0) : sum),
    0,
  );

  const schedule =
    (fullStudent.accessLevel === "FULL" || fullStudent.accessLevel === "ALUMNI") && activeBatchId
      ? await prisma.scheduleEntry.findMany({
          where: { batchId: activeBatchId },
          include: {
            teacher: { select: { name: true, role: true, styles: true } },
          },
          orderBy: [{ date: "asc" }, { dayNumber: "asc" }],
          take: 14,
        })
      : [];

  const announcements = activeBatchId
    ? await prisma.announcement.findMany({
        where: {
          publishedAt: { not: null },
          OR: [{ batchId: activeBatchId }, { type: "GENERAL" }, { type: "URGENT" }],
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : await prisma.announcement.findMany({
        where: { publishedAt: { not: null }, OR: [{ type: "GENERAL" }, { type: "URGENT" }] },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

  const certificateEligibility = await getCertificateEligibility(fullStudent.id);
  const allowedAudiences =
    fullStudent.accessLevel === "ALUMNI"
      ? ["ALUMNI", "ALL_ACTIVE"]
      : fullStudent.accessLevel === "FULL"
        ? ["PRE_ARRIVAL", "FULL", "ALL_ACTIVE"]
        : ["PRE_ARRIVAL", "ALL_ACTIVE"];

  const resources = await prisma.preArrivalResource.findMany({
    where: {
      isActive: true,
      audience: { in: allowedAudiences as ("PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE")[] },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const notifications = await prisma.notification.findMany({
    where: {
      publishedAt: { not: null },
      OR: [
        { audience: { in: allowedAudiences as ("PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE")[] } },
        { audience: "INDIVIDUAL", studentId: fullStudent.id },
        ...(activeBatchId ? [{ batchId: activeBatchId }] : []),
      ],
    },
    include: {
      receipts: {
        where: { studentId: fullStudent.id },
        select: { readAt: true },
        take: 1,
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  const enrollmentBatchIds = Array.from(
    new Set(fullStudent.enrollments.map((enrollment) => enrollment.batchId).filter(Boolean) as string[]),
  );
  const enrollmentBatches = enrollmentBatchIds.length
    ? await prisma.batch.findMany({
        where: { id: { in: enrollmentBatchIds } },
        include: { course: true },
      })
    : [];
  const enrollmentBatchById = new Map(enrollmentBatches.map((batch) => [batch.id, batch]));

    return jsonWithRequestId({
    student: {
      id: fullStudent.id,
      email: fullStudent.user.email,
      name: fullStudent.user.displayName || fullStudent.user.email,
      enrolledCourse: fullStudent.enrolledCourse,
      batchId: activeBatchId,
      paymentStatus: fullStudent.paymentStatus,
      accessLevel: fullStudent.accessLevel,
      completedHours: derivedCompletedHours || fullStudent.completedHours,
      totalHours: derivedTotalHours,
      phone: fullStudent.phone,
      nationality: fullStudent.nationality,
      dietaryRequirements: fullStudent.dietaryRequirements,
      yogaExperience: fullStudent.yogaExperience,
      emergencyContact: fullStudent.emergencyContact,
      personalNotes: fullStudent.personalNotes,
      batch: activeBatch,
      latestEnrollment: fullStudent.enrollments[0] || null,
      enrollments: fullStudent.enrollments.map((enrollment) => ({
        id: enrollment.id,
        courseSlug: enrollment.courseSlug,
        courseName: enrollment.batchId
          ? enrollmentBatchById.get(enrollment.batchId)?.course?.name || enrollment.courseSlug
          : enrollment.courseSlug,
        batchId: enrollment.batchId,
        batchName: enrollment.batchId ? enrollmentBatchById.get(enrollment.batchId)?.name || null : null,
        accommodation: enrollment.accommodation,
        paymentType: enrollment.paymentType,
        paymentStatus: enrollment.paymentStatus,
        accessLevel: enrollment.accessLevel,
        amount: enrollment.amount,
        currency: enrollment.currency,
        discount: enrollment.discount,
        couponCode: enrollment.couponCode,
        createdAt: enrollment.createdAt,
        payments: enrollment.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          createdAt: payment.createdAt,
        })),
      })),
      paymentSummary: {
        confirmedPayments: fullStudent.enrollments.filter((enrollment) =>
          ["DEPOSIT_PAID", "FULL_PAID"].includes(enrollment.paymentStatus),
        ).length,
        pendingPayments: fullStudent.enrollments.filter((enrollment) => enrollment.paymentStatus === "PENDING").length,
        failedPayments: fullStudent.enrollments.filter((enrollment) => enrollment.paymentStatus === "FAILED").length,
        totalPaid: fullStudent.enrollments
          .filter((enrollment) => ["DEPOSIT_PAID", "FULL_PAID"].includes(enrollment.paymentStatus))
          .reduce((sum, enrollment) => sum + enrollment.amount, 0),
      },
    },
    tasks: fullStudent.accessLevel === "ALUMNI" ? [] : refreshedTasks,
    progress: refreshedProgress,
    certificates: fullStudent.certificates,
    certificateEligibility,
    resources: resources.map((resource) => ({
      ...resource,
      url: `/api/app/resources/${resource.id}`,
    })),
    schedule: schedule.map((entry) => ({
      ...entry,
      activities: Array.isArray(entry.activities) ? entry.activities : [],
      teacher: entry.teacher,
    })),
    announcements,
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      actionUrl: item.actionUrl,
      publishedAt: item.publishedAt,
      readAt: item.receipts[0]?.readAt || null,
    })),
    unreadNotifications: notifications.filter((item) => !item.receipts[0]?.readAt).length,
    }, undefined, request);
  } catch (error) {
    logApiError("app.portal", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to load student portal" }, { status: 500 }, request);
  }
}
