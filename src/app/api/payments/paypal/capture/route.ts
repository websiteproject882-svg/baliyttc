import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { markPaymentComplete } from "@/lib/payments/complete";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const captureSchema = z.object({
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const data = captureSchema.parse(await request.json());
    const capture = await capturePayPalOrder(data.orderId);

    if (capture.status !== "COMPLETED") {
      return jsonWithRequestId({ success: false, status: capture.status }, { status: 402 }, request);
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payment = await prisma.payment.findFirst({
      where: { paypalOrderId: data.orderId },
      include: { enrollment: true },
    });

    if (!payment) {
      return jsonWithRequestId({ error: "Payment not found" }, { status: 404 }, request);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paypalCaptureId: captureId,
        providerPayload: capture,
      },
    });

    await markPaymentComplete({
      paymentId: payment.id,
      paymentType: payment.enrollment.paymentType.toLowerCase(),
      providerPayload: capture,
    });

    return jsonWithRequestId({ success: true, capture }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("payments.paypal.capture", error, request);
    return jsonWithRequestId({ error: "PayPal capture failed" }, { status: 500 }, request);
  }
}
