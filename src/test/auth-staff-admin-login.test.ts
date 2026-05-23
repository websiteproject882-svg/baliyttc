import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as adminLogin } from "../app/api/auth/admin/login/route";
import { POST as staffLogin } from "../app/api/auth/staff/login/route";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  staffUpdate: vi.fn(),
  createSession: vi.fn(),
  createTwoFactorChallenge: vi.fn(),
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
    },
    staff: {
      update: mocks.staffUpdate,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  createSession: mocks.createSession,
  createTwoFactorChallenge: mocks.createTwoFactorChallenge,
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

vi.mock("@/lib/rbac", () => ({
  getRoleHomePath: (role: string) => (role === "SUPER_ADMIN" ? "/en/admin" : "/en/staff/dashboard"),
  isAdminPanelRole: () => true,
}));

const adminUser = {
  id: "user_admin",
  uid: "old_uid",
  email: "owner@example.com",
  staff: {
    id: "staff_admin",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    totpEnabled: false,
    totpSecret: null,
  },
};

const staffUser = {
  id: "user_staff",
  uid: "old_uid",
  email: "teacher@example.com",
  staff: {
    id: "staff_teacher",
    role: "TEACHER",
    status: "ACTIVE",
    permissions: ["students.view"],
    totpEnabled: false,
    totpSecret: null,
  },
};

function request(url: string, body: Record<string, unknown> = {}) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-request-id": "req_auth_login" },
    body: JSON.stringify({ idToken: "firebase_token", ...body }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 });
  mocks.verifyIdToken.mockResolvedValue({
    uid: "new_uid",
    email: "owner@example.com",
    name: "Owner",
    picture: "https://example.com/avatar.png",
  });
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userUpdate.mockResolvedValue({});
  mocks.staffUpdate.mockResolvedValue({});
});

describe("admin and staff Firebase login", () => {
  it("binds an existing admin email to a new Firebase uid", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(adminUser);

    const response = await adminLogin(request("https://example.com/api/auth/admin/login"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_admin" },
      data: {
        uid: "new_uid",
        email: "owner@example.com",
        displayName: "Owner",
        photoURL: "https://example.com/avatar.png",
      },
    });
    expect(mocks.createSession).toHaveBeenCalledWith("user_admin", "SUPER_ADMIN", "owner@example.com", "admin");
  });

  it("binds an existing staff email to a new Firebase uid", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "new_uid",
      email: "teacher@example.com",
      name: "Teacher",
      picture: null,
    });
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(staffUser);

    const response = await staffLogin(request("https://example.com/api/auth/staff/login"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_staff" },
      data: {
        uid: "new_uid",
        email: "teacher@example.com",
        displayName: "Teacher",
        photoURL: null,
      },
    });
    expect(mocks.createSession).toHaveBeenCalledWith("user_staff", "TEACHER", "teacher@example.com", "staff");
  });

  it("blocks admin login when uid and email belong to different users", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({ ...adminUser, id: "user_from_uid" })
      .mockResolvedValueOnce({ ...adminUser, id: "user_from_email" });

    const response = await adminLogin(request("https://example.com/api/auth/admin/login"));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("This Firebase account is linked to a different admin email.");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
