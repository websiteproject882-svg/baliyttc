import { DiscountType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const optionalDateString = z
  .string()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Invalid date")
  .nullable()
  .optional();

const couponBaseSchema = z.object({
  code: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()),
  discountType: z.nativeEnum(DiscountType),
  discount: z.coerce.number().int().positive(),
  minAmount: z.coerce.number().int().nonnegative().nullable().optional(),
  maxDiscount: z.coerce.number().int().nonnegative().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: optionalDateString,
  isActive: z.boolean().default(true),
});

const validateDiscount = (data: { discountType: DiscountType; discount: number }, ctx: z.RefinementCtx) => {
  if (data.discountType === DiscountType.PERCENTAGE && data.discount > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount"],
      message: "Percentage discount cannot exceed 100",
    });
  }
};

const couponSchema = couponBaseSchema.superRefine(validateDiscount);

const updateSchema = couponBaseSchema.extend({
  id: z.string().trim().min(1).max(120),
}).superRefine(validateDiscount);

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("coupons.view");
  if (response) {
    return response;
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
    return jsonWithRequestId({ coupons }, undefined, request);
  } catch (error) {
    logApiError("admin.coupons.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch coupons" }, { status: 500 }, request);
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
    const parsed = couponSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
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

    return jsonWithRequestId({ success: true, coupon }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.coupons.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create coupon" }, { status: 500 }, request);
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
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Coupon not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true, coupon }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.coupons.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update coupon" }, { status: 500 }, request);
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
    const parsedQuery = deleteQuerySchema.safeParse({ id: searchParams.get("id") });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Coupon id is required" }, { status: 400 }, request);
    }
    const { id } = parsedQuery.data;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Coupon not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.coupons.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete coupon" }, { status: 500 }, request);
  }
}
