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
        status?: string;
        amount?: number;
        currency?: string;
        notes?: { paymentType?: string };
      };
    };
  };
};

type StoredPaymentForWebhook = {
  amount: number;
  currency: string;
};

function parseWebhookJson(rawBody: string) {
  try {
    return { ok: true as const, event: JSON.parse(rawBody) as unknown };
  } catch {
    return { ok: false as const };
  }
}

function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

function providerMinorAmountMatches(payment: StoredPaymentForWebhook, amount: unknown, currency: unknown) {
  const providerAmount = typeof amount === "number" ? amount : Number(amount);
  const providerCurrency = typeof currency === "string" ? currency.toUpperCase() : "";

  return (
    Number.isFinite(providerAmount) &&
    providerCurrency === payment.currency.toUpperCase() &&
    providerAmount === toMinorUnits(payment.amount)
  );
}

function providerMajorAmountMatches(payment: StoredPaymentForWebhook, amount: unknown, currency: unknown) {
  const providerAmount = typeof amount === "number" ? amount : Number(amount);
  const providerCurrency = typeof currency === "string" ? currency.toUpperCase() : "";

  return (
    Number.isFinite(providerAmount) &&
    providerCurrency === payment.currency.toUpperCase() &&
    toMinorUnits(providerAmount) === toMinorUnits(payment.amount)
  );
}

export async function POST(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get("provider") || "razorpay";
    if (provider !== "razorpay" && provider !== "paypal") {
      return jsonWithRequestId({ error: "Unsupported payment provider" }, { status: 400 }, request);
    }
    const rawBody = await request.text();

    if (provider === "paypal") {
      const parsed = parseWebhookJson(rawBody);
      if (!parsed.ok) {
        return jsonWithRequestId({ error: "Invalid webhook JSON" }, { status: 400 }, request);
      }

      const event = parsed.event as {
        id?: string;
        event_type?: string;
        resource?: {
          id?: string;
          status?: string;
          purchase_units?: Array<{
            custom_id?: string;
            payments?: {
              captures?: Array<{
                id?: string;
                status?: string;
                amount?: { value?: string; currency_code?: string };
              }>;
            };
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
        const capturedPayment = event.resource?.purchase_units?.[0]?.payments?.captures?.[0];
        const captureId = capturedPayment?.id || event.resource?.id;
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
          if (
            capturedPayment?.status !== "COMPLETED" ||
            !providerMajorAmountMatches(payment, capturedPayment.amount?.value, capturedPayment.amount?.currency_code)
          ) {
            return jsonWithRequestId(
              { error: "PayPal webhook capture does not match the stored payment." },
              { status: 409 },
              request,
            );
          }

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

    const parsed = parseWebhookJson(rawBody);
    if (!parsed.ok) {
      return jsonWithRequestId({ error: "Invalid webhook JSON" }, { status: 400 }, request);
    }

    const event = parsed.event as RazorpayWebhookEvent;
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
        if (
          paymentEntity.status !== "captured" ||
          !providerMinorAmountMatches(payment, paymentEntity.amount, paymentEntity.currency)
        ) {
          return jsonWithRequestId(
            { error: "Razorpay webhook payment does not match the stored payment." },
            { status: 409 },
            request,
          );
        }

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
