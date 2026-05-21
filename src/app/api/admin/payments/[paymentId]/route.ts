import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { markPaymentComplete, statusForPaymentType } from "@/lib/payments/complete";
import { refundPayPalCapture } from "@/lib/payments/paypal";
import { refundRazorpayPayment } from "@/lib/payments/razorpay-refunds";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["mark_paid", "mark_failed", "refund"]),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paymentId: string } },
) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("payments.refund");
  if (!user || response) {
    return response;
  }

  try {
    const data = actionSchema.parse(await request.json());
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { enrollment: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (data.action === "mark_paid") {
      await markPaymentComplete({
        paymentId: payment.id,
        paymentType: payment.enrollment.paymentType.toLowerCase(),
        providerPayload: {
          adminAction: "mark_paid",
          reason: data.reason,
          at: new Date().toISOString(),
        },
      });
      await writeAuditLog({
        actorUserId: user.id,
        action: "payment.mark_paid",
        entity: "payment",
        entityId: payment.id,
        oldValue: { status: payment.status, enrollmentStatus: payment.enrollment.paymentStatus },
        newValue: { status: "COMPLETED", enrollmentStatus: statusForPaymentType(payment.enrollment.paymentType).paymentStatus },
        request,
      });

      return NextResponse.json({ success: true });
    }

    if (data.action === "mark_failed") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          providerPayload: {
            adminAction: "mark_failed",
            reason: data.reason,
            at: new Date().toISOString(),
          },
        },
      });

      await prisma.enrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          paymentStatus: "FAILED",
          accessLevel: "NONE",
        },
      });
      await writeAuditLog({
        actorUserId: user.id,
        action: "payment.mark_failed",
        entity: "payment",
        entityId: payment.id,
        oldValue: { status: payment.status, enrollmentStatus: payment.enrollment.paymentStatus },
        newValue: { status: "FAILED", enrollmentStatus: "FAILED" },
        request,
      });

      return NextResponse.json({ success: true });
    }

    const refundAmount = data.amount || payment.amount;
    let providerRefund: unknown = null;

    if (payment.method === "RAZORPAY") {
      if (!payment.razorpayPaymentId) {
        return NextResponse.json({ error: "Missing Razorpay payment id" }, { status: 400 });
      }
      providerRefund = await refundRazorpayPayment({
        paymentId: payment.razorpayPaymentId,
        amount: refundAmount,
        notes: { reason: data.reason || "Admin refund" },
      });
    }

    if (payment.method === "PAYPAL") {
      if (!payment.paypalCaptureId) {
        return NextResponse.json({ error: "Missing PayPal capture id" }, { status: 400 });
      }
      providerRefund = await refundPayPalCapture({
        captureId: payment.paypalCaptureId,
        amount: refundAmount,
        currency: payment.currency,
        note: data.reason,
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundAmount,
        refundReason: data.reason,
        providerPayload: {
          adminAction: "refund",
          providerRefund,
          at: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    const previousStatus = statusForPaymentType(payment.enrollment.paymentType).paymentStatus;
    await prisma.enrollment.update({
      where: { id: payment.enrollmentId },
      data: {
        paymentStatus: payment.enrollment.paymentStatus === previousStatus ? "REFUNDED" : payment.enrollment.paymentStatus,
        accessLevel: "NONE",
      },
    });
    await writeAuditLog({
      actorUserId: user.id,
      action: "payment.refund",
      entity: "payment",
      entityId: payment.id,
      oldValue: { status: payment.status, enrollmentStatus: payment.enrollment.paymentStatus, amount: payment.amount },
      newValue: { status: "REFUNDED", enrollmentStatus: "REFUNDED", refundAmount, reason: data.reason },
      request,
    });

    return NextResponse.json({ success: true, providerRefund });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Admin payment action error:", error);
    return NextResponse.json({ error: "Payment action failed" }, { status: 500 });
  }
}
