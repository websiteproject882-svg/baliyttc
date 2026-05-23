import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "../app/api/admin/payments/[paymentId]/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  enrollmentUpdate: vi.fn(),
  studentUpdate: vi.fn(),
  markPaymentComplete: vi.fn(),
  refundRazorpayPayment: vi.fn(),
  refundPayPalCapture: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      findUnique: mocks.paymentFindUnique,
      update: mocks.paymentUpdate,
    },
    enrollment: {
      update: mocks.enrollmentUpdate,
    },
    student: {
      update: mocks.studentUpdate,
    },
  },
}));

vi.mock("@/lib/payments/complete", () => ({
  markPaymentComplete: mocks.markPaymentComplete,
  statusForPaymentType: (paymentType?: string) =>
    paymentType?.toLowerCase() === "deposit"
      ? { paymentStatus: "DEPOSIT_PAID", accessLevel: "PRE_ARRIVAL" }
      : { paymentStatus: "FULL_PAID", accessLevel: "FULL" },
}));

vi.mock("@/lib/payments/razorpay-refunds", () => ({
  refundRazorpayPayment: mocks.refundRazorpayPayment,
}));

vi.mock("@/lib/payments/paypal", () => ({
  refundPayPalCapture: mocks.refundPayPalCapture,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const adminUser = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin",
  role: "FINANCE_MANAGER",
  permissions: ["payments.refund"],
  authType: "admin",
};

const payment = {
  id: "payment_1",
  enrollmentId: "enrollment_1",
  amount: 499,
  currency: "EUR",
  method: "RAZORPAY",
  status: "PENDING",
  razorpayPaymentId: "rzp_payment_1",
  paypalCaptureId: null,
  enrollment: {
    id: "enrollment_1",
    studentId: "student_1",
    paymentType: "DEPOSIT",
    paymentStatus: "PENDING",
  },
};

function request(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/payments/payment_1", {
    method: "PATCH",
    headers: { "x-request-id": "req_admin_payment" },
    body: JSON.stringify(body),
  });
}

async function patch(body: Record<string, unknown>, paymentId = "payment_1") {
  return PATCH(request(body), { params: { paymentId } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: adminUser, response: null });
  mocks.paymentFindUnique.mockResolvedValue(payment);
  mocks.paymentUpdate.mockResolvedValue({ id: "payment_1" });
  mocks.enrollmentUpdate.mockResolvedValue({ id: "enrollment_1" });
  mocks.studentUpdate.mockResolvedValue({ id: "student_1" });
  mocks.markPaymentComplete.mockResolvedValue({ id: "payment_1", status: "DEPOSIT_PAID" });
  mocks.refundRazorpayPayment.mockResolvedValue({ id: "refund_1", status: "processed" });
  mocks.refundPayPalCapture.mockResolvedValue({ id: "paypal_refund_1", status: "COMPLETED" });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin payment action route", () => {
  it("requires the finance refund permission", async () => {
    const forbidden = Response.json({ error: "Forbidden" }, { status: 403 });
    mocks.requirePermission.mockResolvedValue({ user: null, response: forbidden });

    const response = await patch({ action: "mark_paid" });
    const body = await response?.json();

    expect(response?.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.paymentFindUnique).not.toHaveBeenCalled();
  });

  it("marks a payment paid through the shared completion workflow and audits it", async () => {
    const response = await patch({ action: "mark_paid", reason: "Bank confirmed" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_payment");
    expect(body).toEqual({ success: true });
    expect(mocks.markPaymentComplete).toHaveBeenCalledWith({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: expect.objectContaining({
        adminAction: "mark_paid",
        reason: "Bank confirmed",
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "payment.mark_paid",
        entity: "payment",
        entityId: "payment_1",
      }),
    );
  });

  it("marks payment and enrollment failed without provider calls", async () => {
    const response = await patch({ action: "mark_failed", reason: "Student cancelled" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        status: "FAILED",
        providerPayload: expect.objectContaining({
          adminAction: "mark_failed",
          reason: "Student cancelled",
        }),
      },
    });
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        paymentStatus: "FAILED",
        accessLevel: "NONE",
      },
    });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        paymentStatus: "FAILED",
        accessLevel: "NONE",
      },
    });
    expect(mocks.refundRazorpayPayment).not.toHaveBeenCalled();
    expect(mocks.refundPayPalCapture).not.toHaveBeenCalled();
  });

  it("blocks Razorpay refunds when the provider payment id is missing", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      ...payment,
      razorpayPaymentId: null,
    });

    const response = await patch({ action: "refund", amount: 100, reason: "Duplicate" });
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body).toEqual({ error: "Missing Razorpay payment id" });
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.enrollmentUpdate).not.toHaveBeenCalled();
  });

  it("refunds Razorpay payments, resets enrollment access, and writes an audit log", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      ...payment,
      status: "DEPOSIT_PAID",
      enrollment: {
        ...payment.enrollment,
        paymentStatus: "DEPOSIT_PAID",
      },
    });

    const response = await patch({ action: "refund", amount: 100, reason: "Duplicate" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true, providerRefund: { id: "refund_1", status: "processed" } });
    expect(mocks.refundRazorpayPayment).toHaveBeenCalledWith({
      paymentId: "rzp_payment_1",
      amount: 100,
      notes: { reason: "Duplicate" },
    });
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: expect.objectContaining({
        status: "REFUNDED",
        refundAmount: 100,
        refundReason: "Duplicate",
        providerPayload: expect.objectContaining({
          adminAction: "refund",
          providerRefund: { id: "refund_1", status: "processed" },
        }),
      }),
    });
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        paymentStatus: "REFUNDED",
        accessLevel: "NONE",
      },
    });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        paymentStatus: "REFUNDED",
        accessLevel: "NONE",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "payment.refund",
        entityId: "payment_1",
      }),
    );
  });

  it("refunds PayPal captures with the payment currency", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      ...payment,
      method: "PAYPAL",
      razorpayPaymentId: null,
      paypalCaptureId: "capture_1",
      enrollment: {
        ...payment.enrollment,
        paymentStatus: "DEPOSIT_PAID",
      },
    });

    const response = await patch({ action: "refund", reason: "Schedule change" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true, providerRefund: { id: "paypal_refund_1", status: "COMPLETED" } });
    expect(mocks.refundPayPalCapture).toHaveBeenCalledWith({
      captureId: "capture_1",
      amount: 499,
      currency: "EUR",
      note: "Schedule change",
    });
    expect(mocks.refundRazorpayPayment).not.toHaveBeenCalled();
  });
});
