import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/admin/2fa/route";

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  userFindUnique: vi.fn(),
  staffUpdate: vi.fn(),
  generateTotpSecret: vi.fn(),
  generateTotpQrDataUrl: vi.fn(),
  verifyTotpToken: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireAdminUser: mocks.requireAdminUser,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
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
  generateTotpSecret: mocks.generateTotpSecret,
  generateTotpQrDataUrl: mocks.generateTotpQrDataUrl,
  verifyTotpToken: mocks.verifyTotpToken,
}));

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("../lib/security")>("../lib/security");
  return {
    ...actual,
    logApiError: mocks.logApiError,
  };
});

function request(body?: unknown) {
  return new NextRequest("https://example.com/api/admin/2fa", {
    method: body ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_2fa_test",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function mockAdmin() {
  mocks.requireAdminUser.mockResolvedValue({
    user: {
      id: "admin_1",
      email: "admin@example.com",
      role: "SUPER_ADMIN",
    },
    response: null,
  });
}

function mockCurrentUser(staff: Record<string, unknown> | null = {}) {
  mocks.userFindUnique.mockResolvedValue({
    id: "admin_1",
    email: "admin@example.com",
    staff: staff
      ? {
          id: "staff_1",
          totpEnabled: false,
          totpSecret: "SECRET",
          ...staff,
        }
      : null,
  });
}

async function json(response: Response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mockAdmin();
  mockCurrentUser();
  mocks.staffUpdate.mockResolvedValue({});
  mocks.writeAuditLog.mockResolvedValue({});
  mocks.generateTotpSecret.mockReturnValue({
    secret: "NEWSECRET",
    otpauthUrl: "otpauth://totp/BaliYTTC:admin@example.com?secret=NEWSECRET",
  });
  mocks.generateTotpQrDataUrl.mockResolvedValue("data:image/png;base64,qr");
});

describe("admin 2FA route", () => {
  it("returns current 2FA status with request id", async () => {
    mockCurrentUser({ totpEnabled: true, totpSecret: "SECRET" });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_2fa_test");
    expect(await json(response)).toEqual({ enabled: true, hasSecret: true });
  });

  it("generates and stores a pending 2FA secret", async () => {
    const response = await POST(request({ action: "generate" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      success: true,
      manualEntryKey: "NEWSECRET",
      qrCodeDataUrl: "data:image/png;base64,qr",
    });
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: {
        totpSecret: "NEWSECRET",
        totpEnabled: false,
      },
    });
  });

  it("rejects unsupported actions through validation", async () => {
    const response = await POST(request({ action: "reset" }));

    expect(response.status).toBe(400);
    expect((await json(response)).error).toBe("Validation failed");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("requires a code before verifying or disabling 2FA", async () => {
    const response = await POST(request({ action: "verify_setup" }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Missing authentication code" });
    expect(mocks.verifyTotpToken).not.toHaveBeenCalled();
  });

  it("enables 2FA after a valid setup code", async () => {
    mocks.verifyTotpToken.mockReturnValue(true);

    const response = await POST(request({ action: "verify_setup", code: "123456" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true, enabled: true });
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: { totpEnabled: true },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "staff.2fa_enabled",
        entity: "staff",
        entityId: "staff_1",
      }),
    );
  });

  it("clears the secret when disabling 2FA with a valid code", async () => {
    mockCurrentUser({ totpEnabled: true, totpSecret: "SECRET" });
    mocks.verifyTotpToken.mockReturnValue(true);

    const response = await POST(request({ action: "disable", code: "123456" }));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true, enabled: false });
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: {
        totpEnabled: false,
        totpSecret: null,
      },
    });
  });
});
