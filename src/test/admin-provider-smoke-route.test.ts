import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/admin/provider-smoke/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  sendEmail: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: mocks.sendWhatsAppMessage,
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: ["communications.view", "communications.send"],
  authType: "admin",
};

function request(body: unknown) {
  return new NextRequest("https://example.com/api/admin/provider-smoke", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_provider_smoke",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest("https://example.com/api/admin/provider-smoke", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_provider_smoke",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.sendEmail.mockResolvedValue({ success: true, id: "email_1" });
  mocks.sendWhatsAppMessage.mockResolvedValue({ success: true, messageId: "wa_1" });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin provider smoke route", () => {
  it("reports provider configuration status with request id", async () => {
    const response = await GET(new NextRequest("https://example.com/api/admin/provider-smoke", {
      headers: { "x-request-id": "req_provider_smoke" },
    }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_provider_smoke");
    expect(mocks.requirePermission).toHaveBeenCalledWith("communications.view");
    expect(body.providers.email.status).toMatch(/configured|missing|partial/);
    expect(body.providers.whatsapp.status).toMatch(/configured|missing|partial/);
  });

  it("sends email smoke tests and writes masked audit data", async () => {
    const response = await POST(request({ provider: "email", email: "student@example.com" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({
      success: true,
      provider: "email",
      target: "st*****@example.com",
      id: "email_1",
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "student@example.com",
      subject: "Bali YTTC provider smoke test",
    }));
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "provider.smoke_test",
        entity: "email_provider",
        entityId: "email",
        newValue: expect.objectContaining({ target: "st*****@example.com" }),
      }),
    );
  });

  it("rejects malformed JSON before sending provider smoke tests", async () => {
    const response = await POST(rawRequest("{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_provider_smoke");
    expect(body.error).toBe("Validation failed");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });
});
