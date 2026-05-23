import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { toMinorUnits } from "@/lib/payments/pricing";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/payments/paypal";
import { getRazorpayClient, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { resolveEnrollmentPricing, resolveStoredEnrollmentAmount } from "@/lib/payments/enrollment-pricing";
import { getBankTransferInstructions } from "@/lib/payments/bank-transfer";
import { getClientIp, jsonWithRequestId, logApiError, rateLimit } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";
import { requireSameOrigin } from "@/lib/authz";

const paymentCreateSchema = z.object({
  enrollmentId: z.string().min(1),
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
    const limit = rateLimit({
      key: `public:payments:create:${getClientIp(request)}`,
      limit: 12,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: "Too many payment attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const body = await request.json();
    const data = paymentCreateSchema.parse(body);
    const storedEnrollment = await resolveStoredEnrollmentAmount(data.enrollmentId);
    let amount = storedEnrollment.amount;
    const currency = storedEnrollment.currency.toUpperCase();
    let paymentType = storedEnrollment.paymentType.toLowerCase();
    const settings = await getSiteSettings();

    if (storedEnrollment.paymentStatus === "FULL_PAID") {
      return jsonWithRequestId(
        { error: "This enrollment is already fully paid" },
        { status: 409 },
        request,
      );
    }

    if (storedEnrollment.paymentStatus === "DEPOSIT_PAID" && data.paymentType !== "full") {
      return jsonWithRequestId(
        { error: "Deposit has already been paid for this enrollment" },
        { status: 409 },
        request,
      );
    }

    if (storedEnrollment.paymentStatus === "DEPOSIT_PAID" && data.paymentType === "full") {
      const pricing = await resolveEnrollmentPricing({
        courseSlug: storedEnrollment.courseSlug,
        batchId: storedEnrollment.batchId,
        accommodation: storedEnrollment.accommodation,
        couponCode: storedEnrollment.couponCode,
        email: storedEnrollment.email,
      });
      amount = Math.max(pricing.totalAmount - storedEnrollment.amount, 0);
      paymentType = "full";

      if (amount <= 0) {
        return jsonWithRequestId(
          { error: "No remaining balance is due for this enrollment" },
          { status: 409 },
          request,
        );
      }
    }

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
        receipt: data.enrollmentId.slice(0, 40),
        notes: {
          enrollmentId: data.enrollmentId,
          courseName: data.courseName,
          paymentType,
          email: storedEnrollment.email,
          name: storedEnrollment.name,
          displayAmount: String(amount),
          displayCurrency: currency,
        },
      });

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
      email: storedEnrollment.email,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
    });

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
