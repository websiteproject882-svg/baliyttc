import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/authz";

const validateSchema = z.object({
  code: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const body = await request.json();
    const { code, amount } = validateSchema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "Invalid coupon code",
      }, { status: 400 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is no longer active",
      }, { status: 400 });
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has expired",
      }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has reached its usage limit",
      }, { status: 400 });
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of $${coupon.minAmount} required for this coupon`,
      }, { status: 400 });
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

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        originalAmount: amount,
        finalAmount: amount - discount,
        savings: discount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        valid: false,
        error: "Invalid request",
      }, { status: 400 });
    }
    console.error("Coupon validation error:", error);
    return NextResponse.json({
      valid: false,
      error: "Failed to validate coupon",
    }, { status: 500 });
  }
}
