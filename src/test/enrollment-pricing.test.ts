import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEnrollmentPricing, resolveStoredEnrollmentAmount } from "../lib/payments/enrollment-pricing";

const mocks = vi.hoisted(() => ({
  courseFindUnique: vi.fn(),
  batchFindUnique: vi.fn(),
  couponFindUnique: vi.fn(),
  couponFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  enrollmentFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findUnique: mocks.courseFindUnique,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
    },
    coupon: {
      findUnique: mocks.couponFindUnique,
      findFirst: mocks.couponFindFirst,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
    enrollment: {
      findUnique: mocks.enrollmentFindUnique,
    },
  },
}));

vi.mock("@/lib/payments/pricing", () => ({
  calculatePrice: (params: { coursePrice: number; accommodationPrice?: number; couponDiscount?: number }) => {
    const totalBeforeDiscount = params.coursePrice + (params.accommodationPrice || 0);
    const couponDiscount = Math.round(totalBeforeDiscount * ((params.couponDiscount || 0) / 100));
    const finalPrice = Math.max(0, totalBeforeDiscount - couponDiscount);
    const depositAmount = finalPrice > 0 ? Math.min(finalPrice, Math.max(200, Math.round(finalPrice * 0.2))) : 0;
    return {
      basePrice: params.coursePrice,
      accommodationUpgrade: params.accommodationPrice || 0,
      couponDiscount,
      finalPrice,
      depositAmount,
      remainingAmount: finalPrice - depositAmount,
    };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.courseFindUnique.mockResolvedValue({
    priceFrom: 1299,
    priceFull: 1499,
    name: "200-Hour YTTC",
  });
  mocks.batchFindUnique.mockResolvedValue({
    priceEarlyBird: null,
    earlyBirdDeadline: null,
    priceRegular: 1499,
    accommodation: [
      { type: "SHARED", price: 0 },
      { type: "PRIVATE", price: 400 },
    ],
  });
  mocks.couponFindUnique.mockResolvedValue({
    discountType: "PERCENTAGE",
    discount: 10,
    minAmount: null,
    maxDiscount: 150,
    isActive: true,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
  });
  mocks.couponFindFirst.mockResolvedValue(null);
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.enrollmentFindUnique.mockResolvedValue({
    id: "enrollment_1",
    amount: 499,
    currency: "EUR",
    paymentType: "DEPOSIT",
    paymentStatus: "PENDING",
    courseSlug: "200hr",
    batchId: "batch_1",
    accommodation: "SHARED",
    couponCode: null,
    name: "Asha",
    email: "asha@example.com",
    phone: "+911234567890",
  });
});

describe("enrollment pricing helpers", () => {
  it("normalizes pricing lookup inputs and applies capped coupons", async () => {
    const pricing = await resolveEnrollmentPricing({
      courseSlug: " 200hr ",
      batchId: " batch_1 ",
      accommodation: "PRIVATE",
      couponCode: " save10 ",
      email: " ASHA@example.COM ",
    });

    expect(mocks.courseFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "200hr" } }));
    expect(mocks.batchFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "batch_1" } }));
    expect(mocks.couponFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { code: "SAVE10" } }));
    expect(mocks.userFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "asha@example.com" } }));
    expect(pricing).toEqual(
      expect.objectContaining({
        courseName: "200-Hour YTTC",
        basePrice: 1499,
        accommodationPrice: 400,
        discount: 150,
        appliedCouponCode: "SAVE10",
        totalAmount: 1749,
        depositAmount: 350,
        remainingAmount: 1399,
      }),
    );
  });

  it("falls back to an active alumni coupon when no explicit coupon is active", async () => {
    mocks.couponFindUnique.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue({ student: { accessLevel: "ALUMNI" } });
    mocks.couponFindFirst.mockResolvedValue({
      code: "ALUMNI15",
      discountType: "PERCENTAGE",
      discount: 15,
      minAmount: null,
      maxDiscount: null,
      isActive: true,
      expiresAt: null,
      usageLimit: null,
      usedCount: 0,
    });

    const pricing = await resolveEnrollmentPricing({
      courseSlug: "200hr",
      accommodation: "SHARED",
      email: "grad@example.com",
    });

    expect(pricing.appliedCouponCode).toBe("ALUMNI15");
    expect(pricing.alumniDiscountApplied).toBe(true);
    expect(pricing.discount).toBe(225);
  });

  it("returns stored enrollment amounts by trimmed enrollment id", async () => {
    const enrollment = await resolveStoredEnrollmentAmount(" enrollment_1 ");

    expect(mocks.enrollmentFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "enrollment_1" },
      }),
    );
    expect(enrollment).toEqual(expect.objectContaining({ id: "enrollment_1", amount: 499 }));
  });
});
