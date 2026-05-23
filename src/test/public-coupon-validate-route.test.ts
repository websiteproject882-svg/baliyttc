import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/coupons/validate/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  couponFindUnique: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    coupon: {
      findUnique: mocks.couponFindUnique,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
}));

function request(body: unknown) {
  return new NextRequest("https://example.com/api/coupons/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.couponFindUnique.mockResolvedValue({
    id: "coupon_1",
    code: "SAVE10",
    discountType: "PERCENTAGE",
    discount: 10,
    minAmount: 500,
    maxDiscount: 200,
    usageLimit: 5,
    usedCount: 1,
    expiresAt: new Date(Date.now() + 86_400_000),
    isActive: true,
  });
});

describe("public coupon validation", () => {
  it("normalizes coupon code and returns capped discount details", async () => {
    const response = await POST(request({ code: " save10 ", amount: 3000 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.couponFindUnique).toHaveBeenCalledWith({ where: { code: "SAVE10" } });
    expect(body).toEqual({
      valid: true,
      coupon: {
        code: "SAVE10",
        discount: 200,
        discountType: "PERCENTAGE",
        originalAmount: 3000,
        finalAmount: 2800,
        savings: 200,
      },
    });
  });

  it("rejects invalid amount and oversized codes before database lookup", async () => {
    const response = await POST(request({ code: "x".repeat(81), amount: 499.5 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ valid: false, error: "Invalid request" });
    expect(mocks.couponFindUnique).not.toHaveBeenCalled();
  });

  it("returns a generic failure and logs unexpected database errors", async () => {
    mocks.couponFindUnique.mockRejectedValue(new Error("database down"));

    const response = await POST(request({ code: "SAVE10", amount: 1000 }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ valid: false, error: "Failed to validate coupon" });
    expect(mocks.logApiError).toHaveBeenCalledWith("coupons.validate", expect.any(Error), expect.any(NextRequest));
  });
});
