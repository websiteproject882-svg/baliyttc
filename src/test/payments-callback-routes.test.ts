import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as verifyRazorpayPayment } from "../app/api/payments/razorpay/verify/route";
import { POST as capturePayPalPayment } from "../app/api/payments/paypal/capture/route";

const mocks = vi.hoisted(() => ({
  paymentFindFirst: vi.fn(),
  paymentUpdate: vi.fn(),
  markPaymentComplete: vi.fn(),
  verifyRazorpayPaymentSignature: vi.fn(),
  capturePayPalOrder: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      findFirst: mocks.paymentFindFirst,
      update: mocks.paymentUpdate,
    },
  },
}));

vi.mock("@/lib/payments/complete", () => ({
  getStoredPaymentType: (payment: { providerPayload?: { paymentType?: string }; enrollment: { paymentType: string } }) =>
    payment.providerPayload?.paymentType || payment.enrollment.paymentType.toLowerCase(),
  markPaymentComplete: mocks.markPaymentComplete,
}));

vi.mock("@/lib/payments/razorpay", () => ({
  verifyRazorpayPaymentSignature: mocks.verifyRazorpayPaymentSignature,
}));

vi.mock("@/lib/payments/paypal", () => ({
  capturePayPalOrder: mocks.capturePayPalOrder,
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: () => null,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const payment = {
  id: "payment_1",
  amount: 499,
  currency: "EUR",
  providerPayload: null,
  enrollment: {
    paymentType: "DEPOSIT",
  },
};

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-request-id": "req_payment_callback" },
    body: JSON.stringify(body),
  });
}

function rawRequest(url: string, body: string) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-request-id": "req_payment_callback" },
    body,
  });
}

function razorpayRequest(overrides: Record<string, unknown> = {}) {
  return request("https://example.com/api/payments/razorpay/verify", {
    razorpay_order_id: "order_123",
    razorpay_payment_id: "pay_123",
    razorpay_signature: "sig_123",
    ...overrides,
  });
}

function paypalRequest(overrides: Record<string, unknown> = {}) {
  return request("https://example.com/api/payments/paypal/capture", {
    orderId: "paypal_order_123",
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyRazorpayPaymentSignature.mockReturnValue(true);
  mocks.capturePayPalOrder.mockResolvedValue({
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [{ id: "capture_123", amount: { currency_code: "EUR", value: "499.00" } }],
        },
      },
    ],
  });
  mocks.paymentFindFirst.mockResolvedValue(payment);
  mocks.paymentUpdate.mockResolvedValue({ id: "payment_1" });
  mocks.markPaymentComplete.mockResolvedValue({ id: "payment_1", status: "DEPOSIT_PAID" });
});

describe("payment callback routes", () => {
  it("rejects invalid Razorpay verification signatures", async () => {
    mocks.verifyRazorpayPaymentSignature.mockReturnValue(false);

    const response = await verifyRazorpayPayment(razorpayRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_callback");
    expect(body.error).toBe("Invalid Razorpay signature");
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("rejects malformed Razorpay verification JSON before provider checks", async () => {
    const response = await verifyRazorpayPayment(
      rawRequest("https://example.com/api/payments/razorpay/verify", "{not-valid-json"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.verifyRazorpayPaymentSignature).not.toHaveBeenCalled();
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("returns 404 when Razorpay callback cannot find a payment", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null);

    const response = await verifyRazorpayPayment(razorpayRequest());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Payment not found");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("stores Razorpay callback details and completes the payment", async () => {
    const response = await verifyRazorpayPayment(razorpayRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith({
      where: { razorpayOrderId: "order_123" },
      include: { enrollment: true },
    });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        razorpayPaymentId: "pay_123",
        razorpaySignature: "sig_123",
      },
    });
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "sig_123",
      },
    });
  });

  it("returns 402 when PayPal capture is not completed", async () => {
    mocks.capturePayPalOrder.mockResolvedValue({ status: "PAYER_ACTION_REQUIRED" });

    const response = await capturePayPalPayment(paypalRequest());
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body).toEqual({ success: false, status: "PAYER_ACTION_REQUIRED" });
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("rejects malformed PayPal capture JSON before provider calls", async () => {
    const response = await capturePayPalPayment(
      rawRequest("https://example.com/api/payments/paypal/capture", "{not-valid-json"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.capturePayPalOrder).not.toHaveBeenCalled();
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("returns 404 when PayPal capture succeeds but local payment is missing", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null);

    const response = await capturePayPalPayment(paypalRequest());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Payment not found");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("stores PayPal capture details and completes the payment", async () => {
    const response = await capturePayPalPayment(paypalRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.capturePayPalOrder).toHaveBeenCalledWith("paypal_order_123");
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith({
      where: { paypalOrderId: "paypal_order_123" },
      include: { enrollment: true },
    });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        paypalCaptureId: "capture_123",
        providerPayload: {
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [{ id: "capture_123", amount: { currency_code: "EUR", value: "499.00" } }],
              },
            },
          ],
        },
      },
    });
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: {
        status: "COMPLETED",
        purchase_units: [
          {
            payments: {
              captures: [{ id: "capture_123", amount: { currency_code: "EUR", value: "499.00" } }],
            },
          },
        ],
      },
    });
  });

  it("rejects PayPal captures when provider amount does not match the local payment", async () => {
    mocks.capturePayPalOrder.mockResolvedValue({
      status: "COMPLETED",
      purchase_units: [
        {
          payments: {
            captures: [{ id: "capture_123", amount: { currency_code: "EUR", value: "1.00" } }],
          },
        },
      ],
    });

    const response = await capturePayPalPayment(paypalRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Captured PayPal amount does not match the stored payment.");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("rejects PayPal captures when provider amount is missing", async () => {
    mocks.capturePayPalOrder.mockResolvedValue({
      status: "COMPLETED",
      purchase_units: [
        {
          payments: {
            captures: [{ id: "capture_123" }],
          },
        },
      ],
    });

    const response = await capturePayPalPayment(paypalRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Captured PayPal amount is missing or invalid.");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("completes callbacks with stored full payment metadata after a deposit", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...payment,
      providerPayload: { paymentType: "full" },
    });

    const response = await capturePayPalPayment(paypalRequest());

    expect(response.status).toBe(200);
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "payment_1",
        paymentType: "full",
      }),
    );
  });
});
