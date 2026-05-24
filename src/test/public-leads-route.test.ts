import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, POST } from "../app/api/leads/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  leadCreate: vi.fn(),
  leadFindUnique: vi.fn(),
  leadUpdate: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
  logLegacyRouteAccess: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    lead: {
      create: mocks.leadCreate,
      findUnique: mocks.leadFindUnique,
      update: mocks.leadUpdate,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mocks.sendEmail,
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

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/leads", {
    method: "PATCH",
    headers: {
      "x-request-id": "req_legacy_leads",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
  });
}

function rawRequest(method: "POST" | "PATCH", body: string, requestId = "req_public_leads") {
  return new NextRequest("https://example.com/api/leads", {
    method,
    headers: {
      "x-request-id": requestId,
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({
    user: { id: "admin_1", email: "admin@example.com" },
    response: null,
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
  mocks.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000 });
  mocks.leadCreate.mockResolvedValue({ id: "lead_1", status: "NEW" });
  mocks.leadFindUnique.mockResolvedValue({ id: "lead_1", status: "NEW" });
  mocks.leadUpdate.mockResolvedValue({ id: "lead_1", status: "CONTACTED" });
  mocks.sendEmail.mockResolvedValue({ success: true });
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
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "New Bali YTTC Lead: Asha Sharma - 200hr",
    }));
  });

  it("rejects oversized public lead payloads", async () => {
    const response = await POST(request({ message: "x".repeat(3001) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed public lead JSON before creating a lead", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_leads");
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
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

  it("validates legacy lead management updates before writing", async () => {
    const response = await PATCH(
      patchRequest({
        id: "lead_1",
        status: "INVALID",
        role: "SUPER_ADMIN",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed legacy lead management JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json", "req_legacy_leads"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_legacy_leads");
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadFindUnique).not.toHaveBeenCalled();
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects empty legacy lead management updates", async () => {
    const response = await PATCH(patchRequest({ id: "lead_1" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("updates only allowed legacy lead management fields", async () => {
    const response = await PATCH(
      patchRequest({
        id: "lead_1",
        status: "CONTACTED",
        notes: " Call tomorrow ",
        assignedTo: " Priya ",
        followUpAt: "2026-02-01",
        email: "changed@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.leadUpdate).toHaveBeenCalledWith({
      where: { id: "lead_1" },
      data: {
        status: "CONTACTED",
        notes: "Call tomorrow",
        assignedTo: "Priya",
        followUpAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "lead.updated.legacy_route",
        entity: "lead",
        entityId: "lead_1",
      }),
    );
  });

  it("allows clearing nullable legacy lead management fields", async () => {
    const response = await PATCH(
      patchRequest({
        id: "lead_1",
        notes: null,
        assignedTo: null,
        followUpAt: "",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.leadUpdate).toHaveBeenCalledWith({
      where: { id: "lead_1" },
      data: {
        notes: null,
        assignedTo: null,
        followUpAt: null,
      },
    });
  });
});
