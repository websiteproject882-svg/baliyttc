import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/authz";
import { getClientIp, jsonWithRequestId, logApiError, rateLimit } from "@/lib/security";

const validateSchema = z.object({
  code: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()),
  amount: z.number().int().positive().max(10_000_000),
});

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `public:coupons:${getClientIp(request)}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { valid: false, error: "Too many coupon checks. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const body = await request.json();
    const { code, amount } = validateSchema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return jsonWithRequestId({
        valid: false,
        error: "Invalid coupon code",
      }, { status: 400 }, request);
    }

    if (!coupon.isActive) {
      return jsonWithRequestId({
        valid: false,
        error: "This coupon is no longer active",
      }, { status: 400 }, request);
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return jsonWithRequestId({
        valid: false,
        error: "This coupon has expired",
      }, { status: 400 }, request);
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return jsonWithRequestId({
        valid: false,
        error: "This coupon has reached its usage limit",
      }, { status: 400 }, request);
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return jsonWithRequestId({
        valid: false,
        error: `Minimum order amount of ${coupon.minAmount} required for this coupon`,
      }, { status: 400 }, request);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.round(amount * (coupon.discount / 100));
    } else {
      discount = coupon.discount;
    }

    // Apply max discount cap
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    // Ensure discount doesn't exceed amount
    discount = Math.min(discount, amount);

    return jsonWithRequestId({
      valid: true,
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        originalAmount: amount,
        finalAmount: amount - discount,
        savings: discount,
      },
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({
        valid: false,
        error: "Invalid request",
      }, { status: 400 }, request);
    }
    logApiError("coupons.validate", error, request);
    return jsonWithRequestId({
      valid: false,
      error: "Failed to validate coupon",
    }, { status: 500 }, request);
  }
}
