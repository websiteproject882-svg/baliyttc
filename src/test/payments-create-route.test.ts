import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/payments/create/route";

const mocks = vi.hoisted(() => ({
  getSiteSettings: vi.fn(),
  paymentFindFirst: vi.fn(),
  paymentUpdate: vi.fn(),
  paymentCreate: vi.fn(),
  resolveStoredEnrollmentAmount: vi.fn(),
  createPayPalOrder: vi.fn(),
  isPayPalConfigured: vi.fn(),
  razorpayOrdersCreate: vi.fn(),
  getRazorpayKeyId: vi.fn(),
  isRazorpayConfigured: vi.fn(),
  getBankTransferInstructions: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      findFirst: mocks.paymentFindFirst,
      update: mocks.paymentUpdate,
      create: mocks.paymentCreate,
    },
  },
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));

vi.mock("@/lib/payments/enrollment-pricing", () => ({
  resolveStoredEnrollmentAmount: mocks.resolveStoredEnrollmentAmount,
}));

vi.mock("@/lib/payments/pricing", () => ({
  toMinorUnits: (amount: number) => Math.round(amount * 100),
}));

vi.mock("@/lib/payments/paypal", () => ({
  createPayPalOrder: mocks.createPayPalOrder,
  isPayPalConfigured: mocks.isPayPalConfigured,
}));

vi.mock("@/lib/payments/razorpay", () => ({
  getRazorpayClient: () => ({
    orders: {
      create: mocks.razorpayOrdersCreate,
    },
  }),
  getRazorpayKeyId: mocks.getRazorpayKeyId,
  isRazorpayConfigured: mocks.isRazorpayConfigured,
}));

vi.mock("@/lib/payments/bank-transfer", () => ({
  getBankTransferInstructions: mocks.getBankTransferInstructions,
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: () => null,
}));

vi.mock("@/lib/security", () => ({
  getClientIp: () => "127.0.0.1",
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
}));

const paymentSettings = {
  paypalEnabled: true,
  razorpayEnabled: true,
  bankTransferEnabled: true,
  depositEnabled: true,
  fullPaymentEnabled: true,
  displayCurrencyPrimary: "EUR",
  displayCurrencySecondary: "USD",
  razorpayCurrency: "INR",
  eurToInrRate: 90,
  usdToInrRate: 83,
  providerOrder: ["razorpay", "paypal", "bank_transfer"],
};

const storedEnrollment = {
  id: "enrollment_1",
  amount: 499,
  currency: "EUR",
  paymentType: "DEPOSIT",
  courseSlug: "200-hour-yttc",
  name: "Stored Student",
  email: "stored@example.com",
  phone: "+911234567890",
};

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/payments/create", {
    method: "POST",
    headers: { "x-request-id": "req_payment_create" },
    body: JSON.stringify({
      enrollmentId: "enrollment_1",
      amount: 1,
      currency: "usd",
      email: "body@example.com",
      name: "Body Student",
      courseName: "Body Course Name",
      paymentType: "deposit",
      ...body,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockReturnValue({ allowed: true, remaining: 11, resetAt: Date.now() + 60_000 });
  mocks.getSiteSettings.mockResolvedValue({ payments: paymentSettings });
  mocks.resolveStoredEnrollmentAmount.mockResolvedValue(storedEnrollment);
  mocks.paymentFindFirst.mockResolvedValue(null);
  mocks.getBankTransferInstructions.mockReturnValue({
    accountName: "Bali YTTC",
    bankName: "Client Bank",
    iban: "ID00TEST",
  });
  mocks.getRazorpayKeyId.mockReturnValue("rzp_test_key");
  mocks.isRazorpayConfigured.mockReturnValue(true);
  mocks.razorpayOrdersCreate.mockResolvedValue({ id: "order_123", status: "created" });
  mocks.isPayPalConfigured.mockReturnValue(true);
  mocks.createPayPalOrder.mockResolvedValue({ id: "paypal_order_123" });
});

describe("payment create route", () => {
  it("blocks a disabled provider before creating a payment intent", async () => {
    mocks.getSiteSettings.mockResolvedValue({
      payments: {
        ...paymentSettings,
        razorpayEnabled: false,
      },
    });

    const response = await POST(createRequest({ provider: "razorpay" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_create");
    expect(body.error).toBe("Razorpay is currently disabled");
    expect(mocks.razorpayOrdersCreate).not.toHaveBeenCalled();
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
  });

  it("reuses a pending bank transfer payment and ignores client supplied amount", async () => {
    mocks.paymentFindFirst.mockResolvedValue({ id: "payment_existing" });

    const response = await POST(createRequest({ provider: "bank_transfer", amount: 99999, currency: "USD" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_existing" },
      data: { amount: 499, currency: "EUR" },
    });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(body.instructions).toEqual(
      expect.objectContaining({
        amount: 499,
        currency: "EUR",
        reference: "enrollment_1",
      }),
    );
  });

  it("charges Razorpay from stored enrollment pricing, not request body pricing", async () => {
    const response = await POST(createRequest({ provider: "razorpay", amount: 99999, currency: "USD" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.razorpayOrdersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 4_491_000,
        currency: "INR",
        notes: expect.objectContaining({
          enrollmentId: "enrollment_1",
          email: "stored@example.com",
          name: "Stored Student",
          displayAmount: "499",
          displayCurrency: "EUR",
        }),
      }),
    );
    expect(mocks.paymentCreate).toHaveBeenCalledWith({
      data: {
        enrollmentId: "enrollment_1",
        amount: 44_910,
        currency: "INR",
        razorpayOrderId: "order_123",
        method: "RAZORPAY",
        status: "PENDING",
      },
    });
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        provider: "razorpay",
        keyId: "rzp_test_key",
        displayAmount: 499,
        displayCurrency: "EUR",
        chargedAmount: 44_910,
        chargedCurrency: "INR",
      }),
    );
  });
});
