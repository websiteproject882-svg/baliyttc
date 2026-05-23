import prisma from "@/lib/prisma";
import { DiscountType, RoomType } from "@prisma/client";
import { calculatePrice } from "@/lib/payments/pricing";

const fallbackAccommodationPrices: Partial<Record<RoomType, number>> = {
  SHARED: 0,
  PRIVATE: 400,
};

function applyCouponDiscount(params: {
  amount: number;
  coupon?: {
    discountType: DiscountType;
    discount: number;
    minAmount: number | null;
    maxDiscount: number | null;
  } | null;
}) {
  const { amount, coupon } = params;
  if (!coupon) return 0;
  if (coupon.minAmount && amount < coupon.minAmount) return 0;

  let discount = coupon.discountType === "PERCENTAGE"
    ? Math.round(amount * (coupon.discount / 100))
    : coupon.discount;

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return Math.min(discount, amount);
}

export async function resolveEnrollmentPricing(input: {
  courseSlug: string;
  batchId?: string | null;
  accommodation: RoomType;
  couponCode?: string | null;
  email?: string | null;
}) {
  const [course, batch, coupon, alumniUser, alumniCoupon] = await Promise.all([
    prisma.course.findUnique({
      where: { slug: input.courseSlug },
      select: { priceFrom: true, priceFull: true, name: true },
    }),
    input.batchId
      ? prisma.batch.findUnique({
          where: { id: input.batchId },
          include: { accommodation: true },
        })
      : Promise.resolve(null),
    input.couponCode
      ? prisma.coupon.findUnique({
          where: { code: input.couponCode.toUpperCase() },
          select: {
            discountType: true,
            discount: true,
            minAmount: true,
            maxDiscount: true,
            isActive: true,
            expiresAt: true,
            usageLimit: true,
            usedCount: true,
          },
        })
      : Promise.resolve(null),
    input.email
      ? prisma.user.findUnique({
          where: { email: input.email },
          select: {
            student: {
              select: { accessLevel: true },
            },
          },
        })
      : Promise.resolve(null),
    prisma.coupon.findFirst({
      where: {
        appliesToAlumni: true,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        code: true,
        discountType: true,
        discount: true,
        minAmount: true,
        maxDiscount: true,
        isActive: true,
        expiresAt: true,
        usageLimit: true,
        usedCount: true,
      },
    }),
  ]);

  const basePrice =
    batch?.priceEarlyBird && batch.earlyBirdDeadline && batch.earlyBirdDeadline > new Date()
      ? batch.priceEarlyBird
      : batch?.priceRegular || course?.priceFull || course?.priceFrom || 999;

  const accommodationPrice =
    batch?.accommodation.find((option) => option.type === input.accommodation)?.price ??
    fallbackAccommodationPrices[input.accommodation] ??
    0;

  const activeCoupon =
    coupon &&
    coupon.isActive &&
    (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
    (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
      ? coupon
      : null;
  const activeAlumniCoupon =
    !activeCoupon &&
    alumniUser?.student?.accessLevel === "ALUMNI" &&
    alumniCoupon &&
    (!alumniCoupon.usageLimit || alumniCoupon.usedCount < alumniCoupon.usageLimit)
      ? alumniCoupon
      : null;

  const grossAmount = basePrice + accommodationPrice;
  const appliedCoupon = activeCoupon || activeAlumniCoupon;
  const appliedCouponCode: string | null = activeAlumniCoupon?.code || (activeCoupon ? input.couponCode?.toUpperCase() || null : null);
  const discount = applyCouponDiscount({ amount: grossAmount, coupon: appliedCoupon });
  const pricing = calculatePrice({
    coursePrice: basePrice,
    accommodationPrice,
    couponDiscount: grossAmount > 0 ? (discount / grossAmount) * 100 : 0,
  });

  return {
    courseName: course?.name || input.courseSlug,
    basePrice,
    accommodationPrice,
    discount,
    appliedCouponCode,
    alumniDiscountApplied: Boolean(activeAlumniCoupon),
    totalAmount: pricing.finalPrice,
    depositAmount: pricing.depositAmount,
    remainingAmount: pricing.remainingAmount,
  };
}

export async function resolveStoredEnrollmentAmount(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      amount: true,
      currency: true,
      paymentType: true,
      paymentStatus: true,
      courseSlug: true,
      batchId: true,
      accommodation: true,
      couponCode: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  return enrollment;
}
