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
  getRoleHomePath: (role: string) => (role === "SUPER_ADMIN" ? "/en/admin" : "/en/app/dashboard"),
  isAdminPanelRole: (role: string) => role === "SUPER_ADMIN",
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

    const response = await POST(request({ email: " STUDENT@Test.COM ", password: "student-secret" }));
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

  it("rejects malformed requests before lookup", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ email: "not-an-email", password: "x".repeat(201) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
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
