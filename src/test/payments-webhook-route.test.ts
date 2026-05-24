import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/payments/webhook/route";

const mocks = vi.hoisted(() => ({
  paymentFindFirst: vi.fn(),
  paymentUpdate: vi.fn(),
  paymentUpdateMany: vi.fn(),
  markPaymentComplete: vi.fn(),
  verifyPayPalWebhook: vi.fn(),
  verifyRazorpayWebhookSignature: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      findFirst: mocks.paymentFindFirst,
      update: mocks.paymentUpdate,
      updateMany: mocks.paymentUpdateMany,
    },
  },
}));

vi.mock("@/lib/payments/complete", () => ({
  getStoredPaymentType: (payment: { providerPayload?: { paymentType?: string }; enrollment: { paymentType: string } }) =>
    payment.providerPayload?.paymentType || payment.enrollment.paymentType.toLowerCase(),
  markPaymentComplete: mocks.markPaymentComplete,
}));

vi.mock("@/lib/payments/paypal", () => ({
  verifyPayPalWebhook: mocks.verifyPayPalWebhook,
}));

vi.mock("@/lib/payments/razorpay", () => ({
  verifyRazorpayWebhookSignature: mocks.verifyRazorpayWebhookSignature,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function webhookRequest(provider: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`https://example.com/api/payments/webhook?provider=${provider}`, {
    method: "POST",
    headers: {
      "x-request-id": "req_payment_webhook",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function rawWebhookRequest(provider: string, body: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://example.com/api/payments/webhook?provider=${provider}`, {
    method: "POST",
    headers: {
      "x-request-id": "req_payment_webhook",
      ...headers,
    },
    body,
  });
}

const pendingPayment = {
  id: "payment_1",
  enrollmentId: "enrollment_1",
  amount: 499,
  currency: "EUR",
  providerPayload: null,
  enrollment: {
    paymentType: "DEPOSIT",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyRazorpayWebhookSignature.mockReturnValue(true);
  mocks.verifyPayPalWebhook.mockResolvedValue(true);
  mocks.paymentUpdate.mockResolvedValue({ id: "payment_1" });
  mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });
  mocks.markPaymentComplete.mockResolvedValue({ id: "payment_1", status: "DEPOSIT_PAID" });
});

describe("payment webhook route", () => {
  it("rejects unsupported webhook providers before signature checks", async () => {
    const response = await POST(webhookRequest("stripe", { id: "evt_unknown" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_webhook");
    expect(body).toEqual({ error: "Unsupported payment provider" });
    expect(mocks.verifyRazorpayWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.verifyPayPalWebhook).not.toHaveBeenCalled();
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
  });

  it("rejects invalid Razorpay signatures before parsing business state", async () => {
    mocks.verifyRazorpayWebhookSignature.mockReturnValue(false);

    const response = await POST(
      webhookRequest(
        "razorpay",
        { id: "evt_bad", event: "payment.captured" },
        { "x-razorpay-signature": "bad_signature" },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_webhook");
    expect(body.error).toBe("Invalid Razorpay signature");
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("treats duplicate provider events as idempotent no-ops", async () => {
    mocks.paymentFindFirst.mockResolvedValueOnce({ id: "existing_payment_with_event" });

    const response = await POST(
      webhookRequest(
        "razorpay",
        { id: "evt_duplicate", event: "payment.captured" },
        { "x-razorpay-signature": "valid_signature" },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("rejects malformed Razorpay webhook JSON after signature verification", async () => {
    const response = await POST(
      rawWebhookRequest("razorpay", "{not-valid-json", { "x-razorpay-signature": "valid_signature" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_webhook");
    expect(body).toEqual({ error: "Invalid webhook JSON" });
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects malformed PayPal webhook JSON before signature verification", async () => {
    const response = await POST(rawWebhookRequest("paypal", "{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_payment_webhook");
    expect(body).toEqual({ error: "Invalid webhook JSON" });
    expect(mocks.verifyPayPalWebhook).not.toHaveBeenCalled();
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("marks Razorpay captured payments complete once and stores provider event data", async () => {
    const event = {
      id: "evt_captured",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_123",
            order_id: "order_123",
            status: "captured",
            amount: 49900,
            currency: "EUR",
            notes: { paymentType: "deposit" },
          },
        },
      },
    };
    mocks.paymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingPayment);

    const response = await POST(webhookRequest("razorpay", event, { "x-razorpay-signature": "valid_signature" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.paymentFindFirst).toHaveBeenNthCalledWith(2, {
      where: { razorpayOrderId: "order_123" },
      include: { enrollment: true },
    });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        razorpayPaymentId: "pay_123",
        providerEventId: "evt_captured",
        providerPayload: event,
      },
    });
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: event,
    });
  });

  it("marks pending Razorpay payments failed on payment.failed events", async () => {
    const event = {
      id: "evt_failed",
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed",
            order_id: "order_failed",
          },
        },
      },
    };
    mocks.paymentFindFirst.mockResolvedValueOnce(null);

    const response = await POST(webhookRequest("razorpay", event, { "x-razorpay-signature": "valid_signature" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith({
      where: { razorpayOrderId: "order_failed", status: "PENDING" },
      data: { status: "FAILED", providerEventId: "evt_failed", providerPayload: event },
    });
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("marks PayPal completed captures paid and stores the capture id", async () => {
    const event = {
      id: "WH-123",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "paypal_order_123",
        purchase_units: [
          {
            custom_id: "enrollment_1",
            payments: {
              captures: [
                {
                  id: "capture_123",
                  status: "COMPLETED",
                  amount: { value: "499.00", currency_code: "EUR" },
                },
              ],
            },
          },
        ],
      },
    };
    mocks.paymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingPayment);

    const response = await POST(webhookRequest("paypal", event));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.verifyPayPalWebhook).toHaveBeenCalled();
    expect(mocks.paymentFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        OR: [
          { paypalOrderId: "paypal_order_123" },
          { paypalCaptureId: "capture_123" },
          { enrollmentId: "enrollment_1" },
        ],
      },
      include: { enrollment: true },
    });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        paypalCaptureId: "capture_123",
        providerEventId: "WH-123",
        providerPayload: event,
      },
    });
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: event,
    });
  });

  it("uses stored payment metadata for PayPal remaining-balance webhooks", async () => {
    const event = {
      id: "WH-full",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "paypal_order_full",
        purchase_units: [
          {
            custom_id: "enrollment_1",
            payments: {
              captures: [
                {
                  id: "capture_full",
                  status: "COMPLETED",
                  amount: { value: "499.00", currency_code: "EUR" },
                },
              ],
            },
          },
        ],
      },
    };
    mocks.paymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...pendingPayment, providerPayload: { paymentType: "full" } });

    const response = await POST(webhookRequest("paypal", event));

    expect(response.status).toBe(200);
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "payment_1",
        paymentType: "full",
      }),
    );
  });

  it("rejects Razorpay captured webhooks when provider amount does not match the stored payment", async () => {
    const event = {
      id: "evt_wrong_amount",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_123",
            order_id: "order_123",
            status: "captured",
            amount: 100,
            currency: "EUR",
          },
        },
      },
    };
    mocks.paymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingPayment);

    const response = await POST(webhookRequest("razorpay", event, { "x-razorpay-signature": "valid_signature" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Razorpay webhook payment does not match the stored payment.");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });

  it("rejects PayPal completed webhooks when provider amount is missing", async () => {
    const event = {
      id: "WH-missing-amount",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "paypal_order_123",
        purchase_units: [
          {
            custom_id: "enrollment_1",
            payments: { captures: [{ id: "capture_123", status: "COMPLETED" }] },
          },
        ],
      },
    };
    mocks.paymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingPayment);

    const response = await POST(webhookRequest("paypal", event));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("PayPal webhook capture does not match the stored payment.");
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.markPaymentComplete).not.toHaveBeenCalled();
  });
});
