import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStoredPaymentType, markPaymentComplete } from "@/lib/payments/complete";
import { verifyPayPalWebhook } from "@/lib/payments/paypal";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { jsonWithRequestId, logApiError } from "@/lib/security";

type RazorpayWebhookEvent = {
  id?: string;
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: { paymentType?: string };
      };
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get("provider") || "razorpay";
    const rawBody = await request.text();

    if (provider === "paypal") {
      const event = JSON.parse(rawBody) as {
        id?: string;
        event_type?: string;
        resource?: {
          id?: string;
          status?: string;
          purchase_units?: Array<{
            custom_id?: string;
            payments?: { captures?: Array<{ id?: string; status?: string }> };
          }>;
        };
      };

      const valid = await verifyPayPalWebhook(request.headers, event);
      if (!valid) {
        return jsonWithRequestId({ error: "Invalid PayPal signature" }, { status: 400 }, request);
      }

      if (!event.id) {
        return jsonWithRequestId({ error: "Missing PayPal event id" }, { status: 400 }, request);
      }

      const existingEvent = await prisma.payment.findFirst({
        where: { providerEventId: event.id },
        select: { id: true },
      });

      if (existingEvent) {
        return jsonWithRequestId({ received: true, duplicate: true }, undefined, request);
      }

      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const paypalOrderId = event.resource?.id;
        const captureId = event.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id || event.resource?.id;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              ...(paypalOrderId ? [{ paypalOrderId }] : []),
              ...(captureId ? [{ paypalCaptureId: captureId }] : []),
              ...(event.resource?.purchase_units?.[0]?.custom_id
                ? [{ enrollmentId: event.resource.purchase_units[0].custom_id }]
                : []),
            ],
          },
          include: { enrollment: true },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paypalCaptureId: captureId,
              providerEventId: event.id,
              providerPayload: event,
            },
          });
          await markPaymentComplete({
            paymentId: payment.id,
            paymentType: getStoredPaymentType(payment),
            providerPayload: event,
          });
        }
      }

      return jsonWithRequestId({ received: true }, undefined, request);
    }

    const signature = request.headers.get("x-razorpay-signature");
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return jsonWithRequestId({ error: "Invalid Razorpay signature" }, { status: 400 }, request);
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    if (!event.id) {
      return jsonWithRequestId({ error: "Missing Razorpay event id" }, { status: 400 }, request);
    }

    const existingEvent = await prisma.payment.findFirst({
      where: { providerEventId: event.id },
      select: { id: true },
    });

    if (existingEvent) {
      return jsonWithRequestId({ received: true, duplicate: true }, undefined, request);
    }

    const paymentEntity = event.payload?.payment?.entity;

    if (event.event === "payment.captured" && paymentEntity?.order_id) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
        include: { enrollment: true },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            providerEventId: event.id,
            providerPayload: event,
          },
        });
        await markPaymentComplete({
          paymentId: payment.id,
          paymentType: paymentEntity.notes?.paymentType || getStoredPaymentType(payment),
          providerPayload: event,
        });
      }
    }

    if (event.event === "payment.failed" && paymentEntity?.order_id) {
      await prisma.payment.updateMany({
        where: { razorpayOrderId: paymentEntity.order_id, status: "PENDING" },
        data: { status: "FAILED", providerEventId: event.id, providerPayload: event },
      });
    }

    return jsonWithRequestId({ received: true }, undefined, request);
  } catch (error) {
    logApiError("payments.webhook", error, request, {
      provider: request.nextUrl.searchParams.get("provider") || "razorpay",
    });
    return jsonWithRequestId({ error: "Webhook handler failed" }, { status: 500 }, request);
  }
}
