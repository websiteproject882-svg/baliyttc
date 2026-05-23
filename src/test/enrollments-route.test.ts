import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/enrollments/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentCount: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    enrollment: {
      findMany: mocks.enrollmentFindMany,
      count: mocks.enrollmentCount,
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
  resolveEnrollmentPricing: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: vi.fn(),
  rateLimit: vi.fn(() => ({ allowed: true, resetAt: Date.now() + 1000 })),
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
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
});
