import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { toMinorUnits } from "@/lib/payments/pricing";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/payments/paypal";
import { getRazorpayClient, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { resolveStoredEnrollmentAmount } from "@/lib/payments/enrollment-pricing";
import { getBankTransferInstructions } from "@/lib/payments/bank-transfer";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";
import { requireSameOrigin } from "@/lib/authz";

const paymentCreateSchema = z.object({
  enrollmentId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("usd"),
  email: z.string().email(),
  name: z.string(),
  courseName: z.string(),
  paymentType: z.enum(["deposit", "full"]),
  provider: z.enum(["razorpay", "paypal", "bank_transfer"]).default("razorpay"),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const body = await request.json();
    const data = paymentCreateSchema.parse(body);
    const storedEnrollment = data.enrollmentId
      ? await resolveStoredEnrollmentAmount(data.enrollmentId)
      : null;
    const amount = storedEnrollment?.amount || data.amount;
    const currency = (storedEnrollment?.currency || data.currency).toUpperCase();
    const paymentType = (storedEnrollment?.paymentType || data.paymentType).toLowerCase();
    const settings = await getSiteSettings();

    if (paymentType === "deposit" && !settings.payments.depositEnabled) {
      return jsonWithRequestId(
        { error: "Deposit payments are currently disabled" },
        { status: 403 },
        request,
      );
    }

    if (paymentType === "full" && !settings.payments.fullPaymentEnabled) {
      return jsonWithRequestId(
        { error: "Full payments are currently disabled" },
        { status: 403 },
        request,
      );
    }

    if (data.provider === "razorpay") {
      if (!settings.payments.razorpayEnabled) {
        return jsonWithRequestId(
          { error: "Razorpay is currently disabled" },
          { status: 403 },
          request,
        );
      }

      if (!isRazorpayConfigured()) {
        return jsonWithRequestId(
          { error: "Razorpay is not configured" },
          { status: 503 },
          request,
        );
      }

      const razorpayAmount =
        currency === "INR"
          ? amount
          : currency === "USD"
            ? Math.round(amount * settings.payments.usdToInrRate)
            : Math.round(amount * settings.payments.eurToInrRate);
      const razorpayCurrency = settings.payments.razorpayCurrency;

      const order = await getRazorpayClient().orders.create({
        amount: toMinorUnits(razorpayAmount),
        currency: razorpayCurrency,
        receipt: data.enrollmentId ? data.enrollmentId.slice(0, 40) : `baliyttc-${Date.now()}`,
        notes: {
          enrollmentId: data.enrollmentId || "",
          courseName: data.courseName,
          paymentType,
          email: storedEnrollment?.email || data.email,
          name: storedEnrollment?.name || data.name,
          displayAmount: String(amount),
          displayCurrency: currency,
        },
      });

      if (data.enrollmentId) {
        const existingPayment = await prisma.payment.findFirst({
          where: {
            enrollmentId: data.enrollmentId,
            method: "RAZORPAY",
            status: "PENDING",
          },
          orderBy: { createdAt: "desc" },
        });

        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              amount: razorpayAmount,
              currency: razorpayCurrency,
              razorpayOrderId: order.id,
              razorpayPaymentId: null,
              razorpaySignature: null,
            },
          });
        } else {
          await prisma.payment.create({
            data: {
              enrollmentId: data.enrollmentId,
              amount: razorpayAmount,
              currency: razorpayCurrency,
              razorpayOrderId: order.id,
              method: "RAZORPAY",
              status: "PENDING",
            },
          });
        }
      }

      return jsonWithRequestId({
        success: true,
        provider: "razorpay",
        keyId: getRazorpayKeyId(),
        displayAmount: amount,
        displayCurrency: currency,
        chargedAmount: razorpayAmount,
        chargedCurrency: razorpayCurrency,
        order,
      }, undefined, request);
    }

    if (data.provider === "bank_transfer") {
      if (!settings.payments.bankTransferEnabled) {
        return jsonWithRequestId(
          { error: "Bank transfer is currently disabled" },
          { status: 403 },
          request,
        );
      }

      if (data.enrollmentId) {
        const existingPayment = await prisma.payment.findFirst({
          where: {
            enrollmentId: data.enrollmentId,
            method: "BANK_TRANSFER",
            status: "PENDING",
          },
          orderBy: { createdAt: "desc" },
        });

        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { amount, currency },
          });
        } else {
          await prisma.payment.create({
            data: {
              enrollmentId: data.enrollmentId,
              amount,
              currency,
              method: "BANK_TRANSFER",
              status: "PENDING",
            },
          });
        }
      }

      return jsonWithRequestId({
        success: true,
        provider: "bank_transfer",
        instructions: {
          ...getBankTransferInstructions(),
          amount,
          currency,
          reference: data.enrollmentId,
        },
      }, undefined, request);
    }

    if (!settings.payments.paypalEnabled) {
      return jsonWithRequestId(
        { error: "PayPal is currently disabled" },
        { status: 403 },
        request,
      );
    }

    if (!isPayPalConfigured()) {
      return jsonWithRequestId(
        { error: "PayPal is not configured" },
        { status: 503 },
        request,
      );
    }

    const order = await createPayPalOrder({
      amount,
      currency,
      enrollmentId: data.enrollmentId,
      courseName: data.courseName,
      paymentType,
      email: storedEnrollment?.email || data.email,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
    });

    if (data.enrollmentId) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          enrollmentId: data.enrollmentId,
          method: "PAYPAL",
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount,
            currency,
            paypalOrderId: order.id,
            paypalCaptureId: null,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            enrollmentId: data.enrollmentId,
            amount,
            currency,
            paypalOrderId: order.id,
            method: "PAYPAL",
            status: "PENDING",
          },
        });
      }
    }

    return jsonWithRequestId({
      success: true,
      provider: "paypal",
      order,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
        request,
      );
    }
    logApiError("payments.create", error, request);
    return jsonWithRequestId(
      { error: "Failed to create payment" },
      { status: 500 },
      request,
    );
  }
}
