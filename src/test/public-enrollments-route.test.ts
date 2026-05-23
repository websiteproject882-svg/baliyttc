import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/enrollments/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  studentFindUnique: vi.fn(),
  studentCreate: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  enrollmentCreate: vi.fn(),
  enrollmentUpdate: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentCount: vi.fn(),
  batchFindUnique: vi.fn(),
  courseFindUnique: vi.fn(),
  resolveEnrollmentPricing: vi.fn(),
  rateLimit: vi.fn(),
  getSiteSettings: vi.fn(),
  sendEnrollmentConfirmation: vi.fn(),
  sendAdminEnrollmentNotification: vi.fn(),
  sendEnrollmentConfirmationEmail: vi.fn(),
  sendAdminNotificationEmail: vi.fn(),
  sendEnrollmentConfirmationWhatsApp: vi.fn(),
  sendWelcomeWhatsApp: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
    student: {
      findUnique: mocks.studentFindUnique,
      create: mocks.studentCreate,
    },
    enrollment: {
      findFirst: mocks.enrollmentFindFirst,
      create: mocks.enrollmentCreate,
      update: mocks.enrollmentUpdate,
      findMany: mocks.enrollmentFindMany,
      count: mocks.enrollmentCount,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
    },
    course: {
      findUnique: mocks.courseFindUnique,
    },
  },
}));

vi.mock("@/lib/gmail-smtp", () => ({
  isGmailConfigured: vi.fn(() => false),
  sendAdminNotificationEmail: mocks.sendAdminNotificationEmail,
  sendEnrollmentConfirmationEmail: mocks.sendEnrollmentConfirmationEmail,
}));

vi.mock("@/lib/resend", () => ({
  sendAdminEnrollmentNotification: mocks.sendAdminEnrollmentNotification,
  sendEnrollmentConfirmation: mocks.sendEnrollmentConfirmation,
}));

vi.mock("@/lib/whatsapp", () => ({
  sendEnrollmentConfirmationWhatsApp: mocks.sendEnrollmentConfirmationWhatsApp,
  sendWelcomeWhatsApp: mocks.sendWelcomeWhatsApp,
}));

vi.mock("@/lib/payments/enrollment-pricing", () => ({
  resolveEnrollmentPricing: mocks.resolveEnrollmentPricing,
}));

vi.mock("@/lib/security", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));

function request(body: unknown) {
  return new NextRequest("https://example.com/api/enrollments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
  });
}

const basePayload = {
  name: "  Asha Student  ",
  email: "  ASHA@example.COM ",
  phone: "  +91 98765 43210 ",
  course: "  200hr ",
  batchId: " batch_1 ",
  accommodation: "SHARED",
  paymentType: "DEPOSIT",
  amount: 1,
  currency: "USD",
  couponCode: "  SAVE10 ",
  preferredDate: "  March 2026 ",
  message: "  Need airport pickup. ",
  referralSource: "  Instagram ",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.getSiteSettings.mockResolvedValue({
    payments: { displayCurrencyPrimary: "EUR" },
    notifications: { emailOnEnrollment: false, whatsappOnEnrollment: false },
  });
  mocks.resolveEnrollmentPricing.mockResolvedValue({
    depositAmount: 499,
    totalAmount: 1499,
    appliedCouponCode: "SAVE10",
    discount: 100,
  });
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userCreate.mockResolvedValue({ id: "user_1", email: "asha@example.com", displayName: "Asha Student" });
  mocks.studentFindUnique.mockResolvedValue(null);
  mocks.studentCreate.mockResolvedValue({ id: "student_1", userId: "user_1" });
  mocks.enrollmentFindFirst.mockResolvedValue(null);
  mocks.enrollmentCreate.mockResolvedValue({
    id: "enrollment_1",
    courseSlug: "200hr",
    batchId: "batch_1",
    paymentType: "DEPOSIT",
    paymentStatus: "PENDING",
    amount: 499,
    currency: "EUR",
    couponCode: "SAVE10",
    discount: 100,
    accessLevel: "NONE",
    name: "Asha Student",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    message: "Need airport pickup.",
  });
  mocks.batchFindUnique.mockResolvedValue({ id: "batch_1", name: "March 2026" });
  mocks.courseFindUnique.mockResolvedValue({ slug: "200hr", name: "200-Hour YTT" });
  mocks.sendEnrollmentConfirmation.mockResolvedValue(undefined);
  mocks.sendEnrollmentConfirmationWhatsApp.mockResolvedValue(undefined);
});

describe("public enrollment creation", () => {
  it("normalizes input, ignores client pricing, and returns a non-PII enrollment payload", async () => {
    const response = await POST(request(basePayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.resolveEnrollmentPricing).toHaveBeenCalledWith(
      expect.objectContaining({
        courseSlug: "200hr",
        batchId: "batch_1",
        couponCode: "SAVE10",
        email: "asha@example.com",
      }),
    );
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "asha@example.com",
        displayName: "Asha Student",
        role: "STUDENT",
        uid: expect.stringMatching(/^local-/),
      }),
    });
    expect(mocks.enrollmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Asha Student",
        email: "asha@example.com",
        phone: "+91 98765 43210",
        courseSlug: "200hr",
        batchId: "batch_1",
        amount: 499,
        currency: "EUR",
        message: "Need airport pickup.",
        referralSource: "Instagram",
      }),
      include: expect.any(Object),
    });
    expect(body.enrollment).toEqual({
      id: "enrollment_1",
      courseSlug: "200hr",
      batchId: "batch_1",
      paymentType: "DEPOSIT",
      paymentStatus: "PENDING",
      amount: 499,
      currency: "EUR",
      couponCode: "SAVE10",
      discount: 100,
      accessLevel: "NONE",
    });
    expect(body.enrollment.email).toBeUndefined();
    expect(body.enrollment.phone).toBeUndefined();
    expect(body.enrollment.message).toBeUndefined();
  });

  it("rejects oversized public messages before writing to the database", async () => {
    const response = await POST(request({ ...basePayload, message: "x".repeat(3001) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.enrollmentCreate).not.toHaveBeenCalled();
  });
});
