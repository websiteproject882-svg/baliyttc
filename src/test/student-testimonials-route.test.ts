import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/app/testimonials/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  writeAuditLog: vi.fn(),
  testimonialFindMany: vi.fn(),
  testimonialCreate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireStudentUser: mocks.requireStudentUser,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    testimonial: {
      findMany: mocks.testimonialFindMany,
      create: mocks.testimonialCreate,
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

const user = {
  id: "user_1",
  email: "student@example.com",
  displayName: "Student One",
  role: "STUDENT",
  permissions: [],
  authType: "student",
};

const student = {
  id: "student_1",
  userId: "user_1",
  accessLevel: "FULL",
  paymentStatus: "FULL_PAID",
  batchId: "batch_1",
  enrolledCourse: "200 Hour YTTC",
};

function request(method: "GET" | "POST", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/app/testimonials", {
    method,
    headers: {
      "x-request-id": "req_student_testimonials",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.testimonialFindMany.mockResolvedValue([
    {
      id: "testimonial_1",
      studentId: "student_1",
      rating: 5,
      quote: "A deeply practical and warm training experience.",
      location: "India",
      courseName: "200 Hour YTTC",
      graduationYear: 2026,
      status: "PENDING",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  ]);
  mocks.testimonialCreate.mockResolvedValue({
    id: "testimonial_2",
    studentId: "student_1",
    rating: 5,
    quote: "The training gave me confidence, structure, and excellent teaching practice.",
    location: "India",
    courseName: "200 Hour YTTC",
    graduationYear: 2026,
    status: "PENDING",
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("student testimonials route", () => {
  it("returns the student's testimonial submissions with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_testimonials");
    expect(body.testimonials).toHaveLength(1);
    expect(mocks.testimonialFindMany).toHaveBeenCalledWith({
      where: { studentId: "student_1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("creates a testimonial using explicit course and year fields", async () => {
    const response = await POST(
      request("POST", {
        rating: 5,
        quote: "The training gave me confidence, structure, and excellent teaching practice.",
        location: "India",
        courseName: "300 Hour YTTC",
        graduationYear: 2026,
      }),
    );
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.testimonialCreate).toHaveBeenCalledWith({
      data: {
        studentId: "student_1",
        rating: 5,
        quote: "The training gave me confidence, structure, and excellent teaching practice.",
        location: "India",
        courseName: "300 Hour YTTC",
        graduationYear: 2026,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_1",
        action: "student.testimonial_submitted",
        entity: "testimonial",
        entityId: "testimonial_2",
      }),
    );
  });

  it("falls back to enrolled course and current year when optional fields are empty", async () => {
    const response = await POST(
      request("POST", {
        rating: 4,
        quote: "The teachers were supportive and the daily practice helped me grow.",
        location: "",
        courseName: "",
        graduationYear: null,
      }),
    );

    expect(response?.status).toBe(200);
    expect(mocks.testimonialCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        location: null,
        courseName: "200 Hour YTTC",
        graduationYear: new Date().getFullYear(),
      }),
    });
  });

  it("validates rating and quote length", async () => {
    const response = await POST(request("POST", { rating: 6, quote: "Too short" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.testimonialCreate).not.toHaveBeenCalled();
  });

  it("requires full access for submissions", async () => {
    const forbidden = Response.json({ error: "Student access is not active" }, { status: 403 });
    mocks.requireStudentUser.mockResolvedValueOnce({ user: null, student: null, response: forbidden });

    const response = await POST(
      request("POST", {
        rating: 5,
        quote: "The training gave me confidence, structure, and excellent teaching practice.",
      }),
    );

    expect(response?.status).toBe(403);
    expect(mocks.testimonialCreate).not.toHaveBeenCalled();
  });

  it("logs list failures without leaking internals", async () => {
    mocks.testimonialFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to load testimonials");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "app.testimonials.list",
      expect.any(Error),
      expect.any(NextRequest),
      { studentId: "student_1" },
    );
  });
});
