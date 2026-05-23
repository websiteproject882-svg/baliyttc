import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalEnv = { ...process.env };

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  staffUpdate: vi.fn(),
  createSession: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    staff: {
      update: mocks.staffUpdate,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  createSession: mocks.createSession,
}));

vi.mock("@/lib/rbac", () => ({
  getRoleHomePath: (role: string) =>
    ["SUPER_ADMIN", "COURSE_MANAGER"].includes(role) ? "/en/admin/overview" : "/en/app/dashboard",
  isAdminPanelRole: (role: string) => ["SUPER_ADMIN", "COURSE_MANAGER"].includes(role),
  isStaffRole: (role: string) => ["COURSE_MANAGER", "TEACHER"].includes(role),
}));

vi.mock("@/lib/security", () => ({
  getClientIp: () => "127.0.0.1",
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
  requireSameOrigin: () => null,
}));

async function loadRoute() {
  vi.resetModules();
  return import("../app/api/auth/test-login/route");
}

function request(body: unknown) {
  return new NextRequest("https://example.com/api/auth/test-login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_test_login",
    },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest("https://example.com/api/auth/test-login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_test_login",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.ENABLE_TEST_LOGIN = "true";
  process.env.TEST_STUDENT_PASSWORD = "student-secret";
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.userFindUnique.mockResolvedValue({
    id: "user_student",
    email: "student@test.com",
    role: "STUDENT",
    staff: null,
    student: {
      id: "student_1",
      accessLevel: "FULL",
    },
  });
  mocks.createSession.mockResolvedValue(undefined);
});

describe("test login route", () => {
  it("normalizes email and creates the expected student session when explicitly enabled", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ email: " STUDENT@Test.COM ", password: "student-secret", portal: "student" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "student@test.com" },
      include: { staff: true, student: true },
    });
    expect(mocks.createSession).toHaveBeenCalledWith("user_student", "STUDENT", "student@test.com", "student");
    expect(body).toEqual({
      success: true,
      role: "STUDENT",
      authType: "student",
      redirectTo: "/en/app/dashboard",
      isAdmin: false,
      testLogin: true,
    });
  });

  it("blocks test-login when the requested portal does not match the account type", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "student@test.com", password: "student-secret", portal: "admin" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "Use the student login page for this account.",
      redirectTo: "/en/login",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates staff sessions for non-teacher staff roles", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_course_manager",
      email: "teacher@test.com",
      role: "STAFF",
      staff: {
        id: "staff_course_manager",
        role: "COURSE_MANAGER",
        status: "ACTIVE",
      },
      student: null,
    });
    process.env.TEST_TEACHER_PASSWORD = "teacher-secret";
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "teacher@test.com", password: "teacher-secret", portal: "staff" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.createSession).toHaveBeenCalledWith(
      "user_course_manager",
      "COURSE_MANAGER",
      "teacher@test.com",
      "staff",
    );
    expect(body).toMatchObject({
      success: true,
      role: "COURSE_MANAGER",
      authType: "staff",
      redirectTo: "/en/admin/overview",
      isAdmin: true,
    });
  });

  it("rejects malformed requests before lookup", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "not-an-email", password: "x".repeat(201) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before lookup", async () => {
    const { POST } = await loadRoute();

    const response = await POST(rawRequest("{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_test_login");
    expect(body.error).toBe("Validation failed");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("returns retry metadata when rate limited", async () => {
    mocks.rateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 30_000 });
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "student@test.com", password: "student-secret" }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(body.error).toBe("Too many login attempts. Try again later.");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("logs unexpected failures without exposing internals", async () => {
    mocks.userFindUnique.mockRejectedValue(new Error("database down"));
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "student@test.com", password: "student-secret" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to login" });
    expect(mocks.logApiError).toHaveBeenCalledWith("auth.test-login", expect.any(Error), expect.any(NextRequest));
  });
});
