import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/leads/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  leadCreate: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
  logLegacyRouteAccess: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: vi.fn(),
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    lead: {
      create: mocks.leadCreate,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  LEGACY_API_SUNSET: "2026-08-31",
  applyDeprecationHeaders: (response: Response) => response,
  getClientIp: () => "127.0.0.1",
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
  logLegacyRouteAccess: mocks.logLegacyRouteAccess,
  rateLimit: mocks.rateLimit,
}));

function request(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/leads", {
    method: "POST",
    headers: {
      "x-request-id": "req_public_leads",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify({
      name: " Asha Sharma ",
      email: " ASHA@EXAMPLE.COM ",
      phone: " +919999999999 ",
      source: " contact-form ",
      course: " 200hr ",
      message: " I want to know more. ",
      ...body,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.leadCreate.mockResolvedValue({ id: "lead_1", status: "NEW" });
});

describe("public leads route", () => {
  it("normalizes and stores bounded public lead submissions", async () => {
    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_leads");
    expect(body).toEqual({ success: true, lead: { id: "lead_1", status: "NEW" } });
    expect(mocks.leadCreate).toHaveBeenCalledWith({
      data: {
        name: "Asha Sharma",
        email: "asha@example.com",
        phone: "+919999999999",
        source: "contact-form",
        course: "200hr",
        message: "I want to know more.",
        status: "NEW",
      },
    });
  });

  it("rejects oversized public lead payloads", async () => {
    const response = await POST(request({ message: "x".repeat(3001) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("rate limits public lead submissions", async () => {
    mocks.rateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 30_000 });

    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(body.error).toBe("Too many lead submissions. Try again later.");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("logs failures without leaking internals", async () => {
    mocks.leadCreate.mockRejectedValue(new Error("database down"));

    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to create lead");
    expect(mocks.logApiError).toHaveBeenCalledWith("leads.create", expect.any(Error), expect.any(NextRequest));
  });
});
