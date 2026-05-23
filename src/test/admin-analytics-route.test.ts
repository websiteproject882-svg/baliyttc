import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/admin/analytics/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  enrollmentCount: vi.fn(),
  enrollmentAggregate: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentGroupBy: vi.fn(),
  studentCount: vi.fn(),
  batchFindMany: vi.fn(),
  leadGroupBy: vi.fn(),
  waitlistGroupBy: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    enrollment: {
      count: mocks.enrollmentCount,
      aggregate: mocks.enrollmentAggregate,
      findMany: mocks.enrollmentFindMany,
      groupBy: mocks.enrollmentGroupBy,
    },
    student: {
      count: mocks.studentCount,
    },
    batch: {
      findMany: mocks.batchFindMany,
    },
    lead: {
      groupBy: mocks.leadGroupBy,
    },
    waitlist: {
      groupBy: mocks.waitlistGroupBy,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: ["admin"],
  authType: "admin",
};

function request(url = "https://example.com/api/admin/analytics") {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "x-request-id": "req_admin_analytics",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.enrollmentCount.mockResolvedValueOnce(12).mockResolvedValueOnce(4);
  mocks.studentCount
    .mockResolvedValueOnce(8)
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(3)
    .mockResolvedValueOnce(4)
    .mockResolvedValueOnce(1);
  mocks.enrollmentAggregate
    .mockResolvedValueOnce({ _sum: { amount: 10000 } })
    .mockResolvedValueOnce({ _sum: { amount: 2500 } })
    .mockResolvedValueOnce({ _sum: { amount: 3000 } });
  mocks.enrollmentFindMany
    .mockResolvedValueOnce([
      {
        id: "enrollment_1",
        name: "Asha",
        email: "asha@example.com",
        courseSlug: "200-hour-ytt",
        amount: 1499,
        paymentStatus: "DEPOSIT_PAID",
        createdAt: new Date("2026-05-10T00:00:00.000Z"),
        user: { email: "asha@example.com", displayName: "Asha" },
      },
    ])
    .mockResolvedValueOnce([
      { amount: 1499, createdAt: new Date("2026-05-10T00:00:00.000Z") },
      { amount: 999, createdAt: new Date("2026-04-10T00:00:00.000Z") },
    ]);
  mocks.enrollmentGroupBy
    .mockResolvedValueOnce([
      { courseSlug: "200-hour-ytt", _count: 3, _sum: { amount: 4500 } },
    ])
    .mockResolvedValueOnce([
      { referralSource: "google", _count: 5 },
      { referralSource: null, _count: 2 },
    ])
    .mockResolvedValueOnce([
      { paymentStatus: "DEPOSIT_PAID", _count: 3 },
      { paymentStatus: "PENDING", _count: 2 },
    ]);
  mocks.batchFindMany
    .mockResolvedValueOnce([
      { name: "June 2026", capacity: 20, enrolled: 10, status: "OPEN" },
      { name: "Zero Capacity", capacity: 0, enrolled: 0, status: "DRAFT" },
    ])
    .mockResolvedValueOnce([{ name: "June 2026", capacity: 20, enrolled: 10 }]);
  mocks.leadGroupBy.mockResolvedValue([{ status: "NEW", _count: 4 }]);
  mocks.waitlistGroupBy.mockResolvedValue([{ status: "WAITING", _count: 2 }]);
});

describe("admin analytics route", () => {
  it("returns analytics summaries for supported dashboard periods", async () => {
    const response = await GET(request("https://example.com/api/admin/analytics?period=30d"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("analytics.revenue");
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_analytics");
    expect(body.stats).toEqual({
      totalEnrollments: 12,
      totalStudents: 8,
      totalRevenue: 10000,
      upcomingBatches: 1,
      monthlyRevenue: 3000,
      revenueChange: 0,
      enrollmentChange: 0,
    });
    expect(body.overview.period).toBe("30d");
    expect(body.enrollmentsByCourse).toEqual([{ course: "200-hour-ytt", count: 3, revenue: 4500 }]);
    expect(body.enrollmentBySource).toEqual([{ source: "google", count: 5 }]);
    expect(body.paymentStatusBreakdown).toEqual({ DEPOSIT_PAID: 3, PENDING: 2 });
    expect(body.accessLevelBreakdown).toEqual({ NONE: 2, PRE_ARRIVAL: 3, FULL: 4, ALUMNI: 1 });
    expect(body.batchUtilization).toEqual([
      { name: "June 2026", enrolled: 10, capacity: 20, utilization: 50, status: "OPEN" },
      { name: "Zero Capacity", enrolled: 0, capacity: 0, utilization: 0, status: "DRAFT" },
    ]);
    expect(body.recentEnrollments[0]).toEqual({
      id: "enrollment_1",
      name: "Asha",
      email: "asha@example.com",
      course: "200-hour-ytt",
      amount: 1499,
      status: "DEPOSIT_PAID",
      date: "2026-05-10T00:00:00.000Z",
    });
  });

  it("validates unknown periods before querying the database", async () => {
    const response = await GET(request("https://example.com/api/admin/analytics?period=bad"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.enrollmentCount).not.toHaveBeenCalled();
  });

  it("logs database failures without leaking internals", async () => {
    mocks.enrollmentCount.mockReset().mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to fetch analytics");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.analytics.summary",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
