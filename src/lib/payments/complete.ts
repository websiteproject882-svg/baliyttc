import prisma from "@/lib/prisma";
import { Prisma, type PaymentStatus } from "@prisma/client";
import { sendPaymentConfirmation } from "@/lib/resend";
import { sendPaymentConfirmationWhatsApp } from "@/lib/whatsapp";

export function statusForPaymentType(paymentType?: string): {
  paymentStatus: PaymentStatus;
  accessLevel: "PRE_ARRIVAL" | "FULL";
} {
  return paymentType?.toLowerCase() === "deposit"
    ? { paymentStatus: "DEPOSIT_PAID", accessLevel: "PRE_ARRIVAL" }
    : { paymentStatus: "FULL_PAID", accessLevel: "FULL" };
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

  if (existingPayment.status === "DEPOSIT_PAID" || existingPayment.status === "FULL_PAID") {
    return existingPayment;
  }

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

  if (existingPayment.enrollment.batchId) {
    await prisma.batch.update({
      where: { id: existingPayment.enrollment.batchId },
      data: { enrolled: { increment: 1 } },
    });
  }

  const course = await prisma.course.findUnique({
    where: { slug: existingPayment.enrollment.courseSlug },
    select: { name: true },
  });

  sendPaymentConfirmation({
    name: existingPayment.enrollment.name,
    email: existingPayment.enrollment.email,
    amount: payment.amount,
    course: course?.name || existingPayment.enrollment.courseSlug,
    paymentType: (params.paymentType || existingPayment.enrollment.paymentType).toLowerCase() === "deposit" ? "deposit" : "full",
  }).catch(console.error);

  sendPaymentConfirmationWhatsApp({
    name: existingPayment.enrollment.name,
    phone: existingPayment.enrollment.phone,
    amount: String(payment.amount),
    course: course?.name || existingPayment.enrollment.courseSlug,
  }).catch(console.error);

  return payment;
}
