import { DiscountType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const couponSchema = z.object({
  code: z.string().min(2).transform((value) => value.toUpperCase()),
  discountType: z.nativeEnum(DiscountType),
  discount: z.coerce.number().int().positive(),
  minAmount: z.coerce.number().int().nonnegative().nullable().optional(),
  maxDiscount: z.coerce.number().int().nonnegative().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

const updateSchema = couponSchema.extend({
  id: z.string(),
});

export async function GET() {
  const { response } = await requirePermission("coupons.view");
  if (response) {
    return response;
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET admin coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("coupons.create");
  if (!user || response) {
    return response;
  }

  try {
    const data = couponSchema.parse(await request.json());
    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        minAmount: data.minAmount ?? null,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "coupon.created",
      entity: "coupon",
      entityId: coupon.id,
      newValue: coupon,
      request,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST admin coupon error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("coupons.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { id, ...data } = updateSchema.parse(await request.json());
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        minAmount: data.minAmount ?? null,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "coupon.updated",
      entity: "coupon",
      entityId: coupon.id,
      oldValue: existing,
      newValue: coupon,
      request,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH admin coupon error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("coupons.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "coupon.deleted",
      entity: "coupon",
      entityId: id,
      oldValue: existing,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin coupon error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
