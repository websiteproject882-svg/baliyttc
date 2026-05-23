import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/enrollments/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  studentFindUnique: vi.fn(),
  studentCreate: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentCount: vi.fn(),
  enrollmentUpdate: vi.fn(),
  enrollmentCreate: vi.fn(),
  batchFindUnique: vi.fn(),
  courseFindUnique: vi.fn(),
  resolveEnrollmentPricing: vi.fn(),
  getSiteSettings: vi.fn(),
  rateLimit: vi.fn(),
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
      findMany: mocks.enrollmentFindMany,
      count: mocks.enrollmentCount,
      update: mocks.enrollmentUpdate,
      create: mocks.enrollmentCreate,
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
  sendAdminNotificationEmail: vi.fn(),
  sendEnrollmentConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/resend", () => ({
  sendAdminEnrollmentNotification: vi.fn(),
  sendEnrollmentConfirmation: vi.fn(),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendEnrollmentConfirmationWhatsApp: vi.fn(),
  sendWelcomeWhatsApp: vi.fn(),
}));

vi.mock("@/lib/payments/enrollment-pricing", () => ({
  resolveEnrollmentPricing: mocks.resolveEnrollmentPricing,
}));

vi.mock("@/lib/security", () => ({
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin",
  role: "SUPER_ADMIN",
  permissions: ["enrollments.view"],
  authType: "admin",
};

function request(url = "https://example.com/api/enrollments?status=pending&course=200hr&page=2&limit=10") {
  return new NextRequest(url, { method: "GET" });
}

function postRequest(body: string) {
  return new NextRequest("https://example.com/api/enrollments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 1000 });
  mocks.getSiteSettings.mockResolvedValue({
    payments: { displayCurrencyPrimary: "EUR" },
    notifications: { emailOnEnrollment: false, whatsappOnEnrollment: false },
  });
  mocks.resolveEnrollmentPricing.mockResolvedValue({
    depositAmount: 499,
    totalAmount: 1499,
    discount: 0,
    appliedCouponCode: null,
  });
  mocks.enrollmentFindMany.mockResolvedValue([{ id: "enrollment_1" }]);
  mocks.enrollmentCount.mockResolvedValue(11);
});

describe("enrollments route", () => {
  it("requires enrollment view permission for the admin list", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("enrollments.view");
    expect(body.enrollments).toEqual([{ id: "enrollment_1" }]);
    expect(body.pagination).toEqual({ page: 2, limit: 10, total: 11, totalPages: 2 });
    expect(mocks.enrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { paymentStatus: "PENDING", courseSlug: "200hr" },
        orderBy: { createdAt: "desc" },
        skip: 10,
        take: 10,
      }),
    );
  });

  it("returns permission errors before reading enrollments", async () => {
    const forbidden = Response.json({ error: "Forbidden" }, { status: 403 });
    mocks.requirePermission.mockResolvedValue({ user: null, response: forbidden });

    const response = await GET(request("https://example.com/api/enrollments"));

    expect(response.status).toBe(403);
    expect(mocks.enrollmentFindMany).not.toHaveBeenCalled();
    expect(mocks.enrollmentCount).not.toHaveBeenCalled();
  });

  it("rejects malformed public enrollment JSON as validation failure", async () => {
    const response = await POST(postRequest("{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.getSiteSettings).not.toHaveBeenCalled();
    expect(mocks.resolveEnrollmentPricing).not.toHaveBeenCalled();
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.enrollmentCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });
});
