import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/login/route";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userUpsert: vi.fn(),
  studentCreate: vi.fn(),
  studentUpdate: vi.fn(),
  enrollmentFindMany: vi.fn(),
  batchFindUnique: vi.fn(),
  createSession: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  auth: {
    verifyIdToken: mocks.verifyIdToken,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      upsert: mocks.userUpsert,
    },
    student: {
      create: mocks.studentCreate,
      update: mocks.studentUpdate,
    },
    enrollment: {
      findMany: mocks.enrollmentFindMany,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  createSession: mocks.createSession,
}));

vi.mock("@/lib/rbac", () => ({
  getRoleHomePath: () => "/en/app/dashboard",
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

const studentUser = {
  id: "user_student",
  uid: "old_uid",
  email: "student@example.com",
  role: "STUDENT",
  staff: null,
  student: {
    id: "student_1",
    accessLevel: "NONE",
    batchId: null,
    enrolledCourse: null,
    phone: null,
  },
};

function request(body: unknown) {
  return new NextRequest("https://example.com/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_student_login",
    },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest("https://example.com/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_student_login",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.verifyIdToken.mockResolvedValue({
    uid: "firebase_uid",
    email: " STUDENT@Example.COM ",
    name: " Student User ",
    picture: "https://example.com/avatar.png",
  });
  mocks.userFindUnique.mockImplementation(({ where }: { where: { uid?: string; email?: string } }) => {
    if (where.email === "student@example.com") return Promise.resolve(studentUser);
    return Promise.resolve(null);
  });
  mocks.userUpdate.mockResolvedValue({
    ...studentUser,
    uid: "firebase_uid",
    displayName: "Student User",
    photoURL: "https://example.com/avatar.png",
  });
  mocks.enrollmentFindMany.mockResolvedValue([]);
  mocks.createSession.mockResolvedValue(undefined);
});

describe("student auth login", () => {
  it("normalizes Firebase email before lookup, profile sync, and session creation", async () => {
    const response = await POST(request({ idToken: " token " }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.verifyIdToken).toHaveBeenCalledWith("token");
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "student@example.com" },
      include: { staff: true, student: true },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_student" },
      data: expect.objectContaining({
        uid: "firebase_uid",
        email: "student@example.com",
        displayName: "Student User",
      }),
      include: { staff: true, student: true },
    });
    expect(mocks.enrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { userId: "user_student" },
            { email: "student@example.com" },
          ],
        },
      }),
    );
    expect(mocks.createSession).toHaveBeenCalledWith("user_student", "STUDENT", "student@example.com", "student");
    expect(body).toEqual({
      success: true,
      role: "STUDENT",
      permissions: [],
      authType: "student",
      redirectTo: "/en/app/dashboard",
      isAdmin: false,
    });
  });

  it("rejects malformed login requests before Firebase verification", async () => {
    const response = await POST(request({ idToken: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid login request" });
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects malformed login JSON before Firebase verification", async () => {
    const response = await POST(rawRequest("{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid login request" });
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("drops unsafe Firebase profile photo URLs during profile sync", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "firebase_uid",
      email: "student@example.com",
      name: "Student User",
      picture: "javascript:alert(1)",
    });

    const response = await POST(request({ idToken: "token" }));

    expect(response.status).toBe(200);
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          photoURL: null,
        }),
      }),
    );
  });
});
