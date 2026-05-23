import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/payments/status/route";

const mocks = vi.hoisted(() => ({
  getSiteSettings: vi.fn(),
  getPaymentProviderReadiness: vi.fn(),
  getCurrentUser: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));

vi.mock("@/lib/payments/readiness", () => ({
  getPaymentProviderReadiness: mocks.getPaymentProviderReadiness,
}));

vi.mock("@/lib/authz", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
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

const readiness = {
  razorpay: {
    envReady: true,
    checkoutReady: true,
    webhookReady: true,
    missingEnv: [],
    requiredEnv: [],
    checkoutEnv: [],
    webhookEnv: [],
  },
  paypal: {
    envReady: false,
    checkoutReady: false,
    webhookReady: false,
    missingEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
    requiredEnv: [],
    checkoutEnv: [],
    webhookEnv: [],
  },
  bankTransfer: {
    envReady: true,
    checkoutReady: true,
    webhookReady: true,
    missingEnv: [],
    requiredEnv: [],
    checkoutEnv: [],
    webhookEnv: [],
  },
};

function request() {
  return new NextRequest("https://example.com/api/payments/status", {
    headers: { "x-request-id": "req_payments_status" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSiteSettings.mockResolvedValue({ payments: paymentSettings });
  mocks.getPaymentProviderReadiness.mockReturnValue(readiness);
  mocks.getCurrentUser.mockResolvedValue(null);
});

describe("payment status route", () => {
  it("returns public payment settings and configured provider states without env diagnostics", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_payments_status");
    expect(body.paymentSettings).toEqual(paymentSettings);
    expect(body.providers.razorpay).toEqual(
      expect.objectContaining({
        configured: true,
        enabled: true,
        label: "Razorpay",
      }),
    );
    expect(body.providers.razorpay).not.toHaveProperty("diagnostics");
    expect(body.providers.razorpay).not.toHaveProperty("missingEnv");
    expect(body.providers.razorpay).not.toHaveProperty("envReady");
    expect(body.providers.paypal).toEqual(
      expect.objectContaining({
        configured: false,
        enabled: true,
        unavailableReason: "Client PayPal checkout keys are pending.",
      }),
    );
    expect(body.providers.paypal).not.toHaveProperty("diagnostics");
    expect(body.providers.bankTransfer).toEqual(
      expect.objectContaining({
        configured: true,
        enabled: true,
        unavailableReason: null,
      }),
    );
  });

  it("includes provider diagnostics for a super admin session", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      displayName: "Admin",
      role: "SUPER_ADMIN",
      permissions: ["*"],
      authType: "admin",
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providers.paypal.diagnostics).toEqual(
      expect.objectContaining({
        envReady: false,
        checkoutReady: false,
        webhookReady: false,
        missingEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
      }),
    );
  });

  it("marks admin-disabled providers unavailable even when env is ready", async () => {
    mocks.getSiteSettings.mockResolvedValue({
      payments: {
        ...paymentSettings,
        razorpayEnabled: false,
        paypalEnabled: false,
        bankTransferEnabled: false,
      },
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providers.razorpay).toEqual(
      expect.objectContaining({
        configured: false,
        enabled: false,
        unavailableReason: "Razorpay is disabled by admin.",
      }),
    );
    expect(body.providers.paypal).toEqual(
      expect.objectContaining({
        configured: false,
        enabled: false,
        unavailableReason: "PayPal is disabled by admin.",
      }),
    );
    expect(body.providers.bankTransfer).toEqual(
      expect.objectContaining({
        configured: false,
        enabled: false,
        unavailableReason: "Bank transfer is disabled by admin.",
      }),
    );
  });

  it("logs failures without exposing internals", async () => {
    mocks.getSiteSettings.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-Id")).toBe("req_payments_status");
    expect(body.error).toBe("Failed to load payment status");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "payments.status",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });
});
