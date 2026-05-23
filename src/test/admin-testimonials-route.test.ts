import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../app/api/admin/testimonials/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  testimonialFindMany: vi.fn(),
  testimonialFindUnique: vi.fn(),
  testimonialUpdate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    testimonial: {
      findMany: mocks.testimonialFindMany,
      findUnique: mocks.testimonialFindUnique,
      update: mocks.testimonialUpdate,
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
  permissions: ["testimonials.view", "testimonials.approve"],
  authType: "admin",
};

const testimonial = {
  id: "testimonial_1",
  studentId: "student_1",
  rating: 5,
  quote: "A strong training with excellent teachers and supportive structure.",
  location: "India",
  courseName: "200 Hour YTTC",
  graduationYear: 2026,
  status: "PENDING",
  approvedAt: null,
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  student: {
    id: "student_1",
    user: {
      email: "student@example.com",
      displayName: "Student One",
    },
  },
};

function request(method: "GET" | "PATCH", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/testimonials", {
    method,
    headers: {
      "x-request-id": "req_admin_testimonials",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.testimonialFindMany.mockResolvedValue([testimonial]);
  mocks.testimonialFindUnique.mockResolvedValue(testimonial);
  mocks.testimonialUpdate.mockResolvedValue({
    ...testimonial,
    status: "APPROVED",
    approvedAt: new Date("2026-02-02T00:00:00.000Z"),
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin testimonials route", () => {
  it("lists testimonials with student identity and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_testimonials");
    expect(mocks.requirePermission).toHaveBeenCalledWith("testimonials.view");
    expect(mocks.testimonialFindMany).toHaveBeenCalledWith({
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(body.testimonials[0]).toEqual(
      expect.objectContaining({
        id: "testimonial_1",
        student: {
          id: "student_1",
          name: "Student One",
          email: "student@example.com",
        },
      }),
    );
  });

  it("falls back to student email when display name is missing", async () => {
    mocks.testimonialFindMany.mockResolvedValue([
      {
        ...testimonial,
        student: {
          id: "student_1",
          user: {
            email: "student@example.com",
            displayName: null,
          },
        },
      },
    ]);

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(body.testimonials[0].student.name).toBe("student@example.com");
  });

  it("approves testimonials and sets approvedAt", async () => {
    const response = await PATCH(request("PATCH", { id: "testimonial_1", status: "APPROVED" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("testimonials.approve");
    expect(mocks.testimonialUpdate).toHaveBeenCalledWith({
      where: { id: "testimonial_1" },
      data: {
        status: "APPROVED",
        approvedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "testimonial.moderated",
        entity: "testimonial",
        entityId: "testimonial_1",
        oldValue: testimonial,
      }),
    );
  });

  it("clears approvedAt when rejecting a testimonial", async () => {
    mocks.testimonialUpdate.mockResolvedValue({ ...testimonial, status: "REJECTED", approvedAt: null });

    const response = await PATCH(request("PATCH", { id: "testimonial_1", status: "REJECTED" }));

    expect(response?.status).toBe(200);
    expect(mocks.testimonialUpdate).toHaveBeenCalledWith({
      where: { id: "testimonial_1" },
      data: {
        status: "REJECTED",
        approvedAt: null,
      },
    });
  });

  it("returns 404 for missing testimonials", async () => {
    mocks.testimonialFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", { id: "missing", status: "APPROVED" }));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Testimonial not found");
    expect(mocks.testimonialUpdate).not.toHaveBeenCalled();
  });

  it("validates moderation status", async () => {
    const response = await PATCH(request("PATCH", { id: "testimonial_1", status: "LIVE" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.testimonialUpdate).not.toHaveBeenCalled();
  });

  it("logs list failures without leaking internals", async () => {
    mocks.testimonialFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to load testimonials");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.testimonials.list",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });
});
