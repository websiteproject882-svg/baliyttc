import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getStoredPaymentType, markPaymentComplete } from "@/lib/payments/complete";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { requireSameOrigin } from "@/lib/authz";

const captureSchema = z.object({
  orderId: z.string(),
});

function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const data = captureSchema.parse(await request.json());
    const capture = await capturePayPalOrder(data.orderId);

    if (capture.status !== "COMPLETED") {
      return jsonWithRequestId({ success: false, status: capture.status }, { status: 402 }, request);
    }

    const capturedPayment = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capturedPayment?.id;
    const payment = await prisma.payment.findFirst({
      where: { paypalOrderId: data.orderId },
      include: { enrollment: true },
    });

    if (!payment) {
      return jsonWithRequestId({ error: "Payment not found" }, { status: 404 }, request);
    }

    const capturedAmount = Number(capturedPayment?.amount?.value);
    const capturedCurrency = capturedPayment?.amount?.currency_code?.toUpperCase();
    if (
      Number.isFinite(capturedAmount) &&
      capturedCurrency &&
      (capturedCurrency !== payment.currency.toUpperCase() || toMinorUnits(capturedAmount) !== toMinorUnits(payment.amount))
    ) {
      return jsonWithRequestId(
        { error: "Captured PayPal amount does not match the stored payment." },
        { status: 409 },
        request,
      );
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
      paymentType: getStoredPaymentType(payment),
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
