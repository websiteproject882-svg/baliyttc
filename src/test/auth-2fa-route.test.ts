import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/2fa/verify/route";

const mocks = vi.hoisted(() => ({
  decrypt: vi.fn(),
  createSession: vi.fn(),
  userFindUnique: vi.fn(),
  staffUpdate: vi.fn(),
  verifyTotpToken: vi.fn(),
  rateLimit: vi.fn(),
  requireSameOrigin: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  decrypt: mocks.decrypt,
  createSession: mocks.createSession,
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

vi.mock("@/lib/totp", () => ({
  verifyTotpToken: mocks.verifyTotpToken,
}));

vi.mock("@/lib/rbac", () => ({
  getRoleHomePath: (role: string) => (role === "TEACHER" ? "/app/teacher/dashboard" : "/admin/overview"),
}));

vi.mock("@/lib/security", () => ({
  getClientIp: () => "127.0.0.1",
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: mocks.logApiError,
  rateLimit: mocks.rateLimit,
  requireSameOrigin: mocks.requireSameOrigin,
}));

function request(body: unknown) {
  return new NextRequest("https://example.com/api/auth/2fa/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
  });
}

async function json(response: Response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.createSession.mockResolvedValue(undefined);
  mocks.staffUpdate.mockResolvedValue({});
});

describe("2FA verification route", () => {
  it("rejects missing challenge or code", async () => {
    const response = await POST(request({ challengeToken: "token" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Missing 2FA challenge or code" });
    expect(mocks.decrypt).not.toHaveBeenCalled();
  });

  it("rejects invalid or expired challenges", async () => {
    mocks.decrypt.mockResolvedValue({ purpose: "login", userId: "user_1" });

    const response = await POST(request({ challengeToken: "bad-token", code: "123456" }));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Invalid or expired 2FA challenge" });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects accounts without configured 2FA", async () => {
    mocks.decrypt.mockResolvedValue({ purpose: "2fa", userId: "user_1", role: "SUPER_ADMIN", authType: "admin" });
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      staff: {
        id: "staff_1",
        totpEnabled: false,
        totpSecret: "secret",
      },
    });

    const response = await POST(request({ challengeToken: "token", code: "123456" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "2FA is not configured for this account" });
    expect(mocks.verifyTotpToken).not.toHaveBeenCalled();
  });

  it("rejects invalid TOTP codes", async () => {
    mocks.decrypt.mockResolvedValue({ purpose: "2fa", userId: "user_1", role: "SUPER_ADMIN", authType: "admin" });
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      staff: {
        id: "staff_1",
        totpEnabled: true,
        totpSecret: "secret",
      },
    });
    mocks.verifyTotpToken.mockReturnValue(false);

    const response = await POST(request({ challengeToken: "token", code: "000000" }));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: "Invalid authentication code" });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates the right session type and redirect after a valid code", async () => {
    mocks.decrypt.mockResolvedValue({ purpose: "2fa", userId: "user_1", role: "SUPER_ADMIN", authType: "admin" });
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      staff: {
        id: "staff_1",
        totpEnabled: true,
        totpSecret: "secret",
      },
    });
    mocks.verifyTotpToken.mockReturnValue(true);

    const response = await POST(request({ challengeToken: "token", code: "123456" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      success: true,
      role: "SUPER_ADMIN",
      authType: "admin",
      redirectTo: "/admin/overview",
    });
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: { lastLogin: expect.any(Date) },
    });
    expect(mocks.createSession).toHaveBeenCalledWith("user_1", "SUPER_ADMIN", "admin@example.com", "admin");
  });

  it("rate limits repeated 2FA attempts", async () => {
    mocks.rateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 30_000 });

    const response = await POST(request({ challengeToken: "token", code: "123456" }));

    expect(response.status).toBe(429);
    expect(await json(response)).toEqual({ error: "Too many 2FA attempts. Try again later." });
    expect(mocks.decrypt).not.toHaveBeenCalled();
  });
});
