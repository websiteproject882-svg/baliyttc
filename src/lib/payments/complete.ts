import prisma from "@/lib/prisma";
import { Prisma, type PaymentStatus } from "@prisma/client";
import { sendPaymentConfirmation } from "@/lib/resend";
import { sendPaymentConfirmationWhatsApp } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/site-settings";
import { logBackgroundError } from "@/lib/security";

export function statusForPaymentType(paymentType?: string): {
  paymentStatus: PaymentStatus;
  accessLevel: "PRE_ARRIVAL" | "FULL";
} {
  return paymentType?.toLowerCase() === "deposit"
    ? { paymentStatus: "DEPOSIT_PAID", accessLevel: "PRE_ARRIVAL" }
    : { paymentStatus: "FULL_PAID", accessLevel: "FULL" };
}

function isPaidStatus(status: PaymentStatus) {
  return status === "DEPOSIT_PAID" || status === "FULL_PAID";
}

type NotificationResult = {
  success?: boolean;
  error?: unknown;
};

function trackPaymentNotification(
  promise: Promise<NotificationResult | unknown>,
  context: string,
  extra: Record<string, unknown>,
) {
  promise
    .then((result) => {
      if (result && typeof result === "object" && "success" in result && (result as NotificationResult).success === false) {
        logBackgroundError(context, (result as NotificationResult).error || "Notification provider returned success=false", extra);
      }
    })
    .catch((error) => logBackgroundError(context, error, extra));
}

export function getStoredPaymentType(payment: { providerPayload?: unknown; enrollment: { paymentType: string } }) {
  const providerPayload = payment.providerPayload;
  if (providerPayload && typeof providerPayload === "object" && !Array.isArray(providerPayload)) {
    const paymentType = (providerPayload as { paymentType?: unknown }).paymentType;
    if (paymentType === "deposit" || paymentType === "full") {
      return paymentType;
    }
  }

  return payment.enrollment.paymentType.toLowerCase();
}

export async function markPaymentComplete(params: {
  paymentId: string;
  paymentType?: string;
  providerPayload?: unknown;
}) {
  const existingPayment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: { enrollment: true },
  });

  if (!existingPayment) {
    throw new Error("Payment not found");
  }

  if (isPaidStatus(existingPayment.status)) {
    return existingPayment;
  }

  const wasEnrollmentAlreadyPaid = isPaidStatus(existingPayment.enrollment.paymentStatus);

  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: statusForPaymentType(params.paymentType || existingPayment.enrollment.paymentType).paymentStatus,
      providerPayload: params.providerPayload as Prisma.InputJsonValue,
    },
  });

  const next = statusForPaymentType(params.paymentType || existingPayment.enrollment.paymentType);
  await prisma.enrollment.update({
    where: { id: payment.enrollmentId },
    data: {
      paymentStatus: next.paymentStatus,
      accessLevel: next.accessLevel,
    },
  });

  const batch = existingPayment.enrollment.batchId
    ? await prisma.batch.findUnique({
        where: { id: existingPayment.enrollment.batchId },
        include: {
          course: {
            include: {
              modules: {
                select: { hours: true },
              },
            },
          },
        },
      })
    : null;
  const studentCourseName = batch?.course?.name || existingPayment.enrollment.courseSlug;
  const totalHours =
    batch?.course?.modules.reduce((sum, module) => sum + (module.hours ?? 0), 0) ||
    existingPayment.enrollment.courseSlug.match(/\d+/)?.[0] ||
    0;

  if (existingPayment.enrollment.studentId) {
    await prisma.student.update({
      where: { id: existingPayment.enrollment.studentId },
      data: {
        paymentStatus: next.paymentStatus,
        accessLevel: next.accessLevel,
        batchId: existingPayment.enrollment.batchId || undefined,
        enrolledCourse: studentCourseName,
        totalHours: Number(totalHours),
      },
    });
  }

  if (!wasEnrollmentAlreadyPaid && existingPayment.enrollment.batchId) {
    await prisma.batch.update({
      where: { id: existingPayment.enrollment.batchId },
      data: { enrolled: { increment: 1 } },
    });
  }

  const course = await prisma.course.findUnique({
    where: { slug: existingPayment.enrollment.courseSlug },
    select: { name: true },
  });

  const settings = await getSiteSettings();
  const notificationContext = {
    paymentId: payment.id,
    enrollmentId: payment.enrollmentId,
  };

  if (settings.notifications.emailOnPayment) {
    trackPaymentNotification(sendPaymentConfirmation({
      name: existingPayment.enrollment.name,
      email: existingPayment.enrollment.email,
      amount: payment.amount,
      currency: payment.currency,
      course: course?.name || existingPayment.enrollment.courseSlug,
      paymentType: (params.paymentType || existingPayment.enrollment.paymentType).toLowerCase() === "deposit" ? "deposit" : "full",
    }), "payments.confirmation-email", notificationContext);
  }

  if (settings.notifications.whatsappOnPayment) {
    trackPaymentNotification(sendPaymentConfirmationWhatsApp({
      name: existingPayment.enrollment.name,
      phone: existingPayment.enrollment.phone,
      amount: String(payment.amount),
      course: course?.name || existingPayment.enrollment.courseSlug,
    }), "payments.confirmation-whatsapp", notificationContext);
  }

  return payment;
}
