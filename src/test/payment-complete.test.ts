import { beforeEach, describe, expect, it, vi } from "vitest";
import { markPaymentComplete, statusForPaymentType } from "../lib/payments/complete";

const mocks = vi.hoisted(() => ({
  paymentFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  enrollmentUpdate: vi.fn(),
  batchUpdate: vi.fn(),
  courseFindUnique: vi.fn(),
  sendPaymentConfirmation: vi.fn(),
  sendPaymentConfirmationWhatsApp: vi.fn(),
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
    batch: {
      update: mocks.batchUpdate,
    },
    course: {
      findUnique: mocks.courseFindUnique,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendPaymentConfirmation: mocks.sendPaymentConfirmation,
}));

vi.mock("@/lib/whatsapp", () => ({
  sendPaymentConfirmationWhatsApp: mocks.sendPaymentConfirmationWhatsApp,
}));

function pendingPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "payment_1",
    enrollmentId: "enrollment_1",
    amount: 499,
    currency: "EUR",
    method: "RAZORPAY",
    status: "PENDING",
    enrollment: {
      id: "enrollment_1",
      paymentType: "DEPOSIT",
      paymentStatus: "PENDING",
      accessLevel: "NONE",
      batchId: "batch_1",
      name: "Student One",
      email: "student@example.com",
      phone: "+911234567890",
      courseSlug: "200-hour-yttc",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.paymentUpdate.mockResolvedValue({
    id: "payment_1",
    enrollmentId: "enrollment_1",
    amount: 499,
    status: "DEPOSIT_PAID",
  });
  mocks.courseFindUnique.mockResolvedValue({ name: "200 Hour Yoga Teacher Training" });
  mocks.sendPaymentConfirmation.mockResolvedValue(undefined);
  mocks.sendPaymentConfirmationWhatsApp.mockResolvedValue(undefined);
});

describe("payment completion", () => {
  it("maps deposit and full payment types to portal access", () => {
    expect(statusForPaymentType("deposit")).toEqual({
      paymentStatus: "DEPOSIT_PAID",
      accessLevel: "PRE_ARRIVAL",
    });
    expect(statusForPaymentType("full")).toEqual({
      paymentStatus: "FULL_PAID",
      accessLevel: "FULL",
    });
  });

  it("marks a deposit as paid, unlocks pre-arrival, increments batch, and sends confirmations", async () => {
    mocks.paymentFindUnique.mockResolvedValue(pendingPayment());

    const result = await markPaymentComplete({
      paymentId: "payment_1",
      paymentType: "deposit",
      providerPayload: { provider: "razorpay" },
    });

    expect(result.status).toBe("DEPOSIT_PAID");
    expect(mocks.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        status: "DEPOSIT_PAID",
        providerPayload: { provider: "razorpay" },
      },
    });
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        paymentStatus: "DEPOSIT_PAID",
        accessLevel: "PRE_ARRIVAL",
      },
    });
    expect(mocks.batchUpdate).toHaveBeenCalledWith({
      where: { id: "batch_1" },
      data: { enrolled: { increment: 1 } },
    });
    expect(mocks.sendPaymentConfirmation).toHaveBeenCalledWith({
      name: "Student One",
      email: "student@example.com",
      amount: 499,
      course: "200 Hour Yoga Teacher Training",
      paymentType: "deposit",
    });
    expect(mocks.sendPaymentConfirmationWhatsApp).toHaveBeenCalledWith({
      name: "Student One",
      phone: "+911234567890",
      amount: "499",
      course: "200 Hour Yoga Teacher Training",
    });
  });

  it("does not double-increment a batch or resend messages for already-paid payments", async () => {
    const paidPayment = pendingPayment({ status: "DEPOSIT_PAID" });
    mocks.paymentFindUnique.mockResolvedValue(paidPayment);

    const result = await markPaymentComplete({ paymentId: "payment_1", paymentType: "deposit" });

    expect(result).toBe(paidPayment);
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.enrollmentUpdate).not.toHaveBeenCalled();
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
    expect(mocks.sendPaymentConfirmation).not.toHaveBeenCalled();
    expect(mocks.sendPaymentConfirmationWhatsApp).not.toHaveBeenCalled();
  });

  it("does not increment batch seats again when enrollment was already paid", async () => {
    mocks.paymentFindUnique.mockResolvedValue(
      pendingPayment({
        enrollment: {
          ...pendingPayment().enrollment,
          paymentStatus: "DEPOSIT_PAID",
          accessLevel: "PRE_ARRIVAL",
        },
      }),
    );

    await markPaymentComplete({ paymentId: "payment_1", paymentType: "full" });

    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        paymentStatus: "FULL_PAID",
        accessLevel: "FULL",
      },
    });
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("throws when payment record is missing", async () => {
    mocks.paymentFindUnique.mockResolvedValue(null);

    await expect(markPaymentComplete({ paymentId: "missing" })).rejects.toThrow("Payment not found");
  });
});
