import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getStoredPaymentType, markPaymentComplete } from "@/lib/payments/complete";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/razorpay";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { requireSameOrigin } from "@/lib/authz";

const verifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(1).max(512),
});

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }
    const data = parsed.data;
    const valid = verifyRazorpayPaymentSignature({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    });

    if (!valid) {
      return jsonWithRequestId({ error: "Invalid Razorpay signature" }, { status: 400 }, request);
    }

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
      include: { enrollment: true },
    });

    if (!payment) {
      return jsonWithRequestId({ error: "Payment not found" }, { status: 404 }, request);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      },
    });

    await markPaymentComplete({
      paymentId: payment.id,
      paymentType: getStoredPaymentType(payment),
      providerPayload: data,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("payments.razorpay.verify", error, request);
    return jsonWithRequestId({ error: "Razorpay verification failed" }, { status: 500 }, request);
  }
}
