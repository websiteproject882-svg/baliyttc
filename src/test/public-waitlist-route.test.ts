import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, POST } from "../app/api/waitlist/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requirePermission: vi.fn(),
  writeAuditLog: vi.fn(),
  waitlistFindFirst: vi.fn(),
  waitlistCreate: vi.fn(),
  waitlistUpdate: vi.fn(),
  batchFindUnique: vi.fn(),
  sendEmail: vi.fn(),
  rateLimit: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    waitlist: {
      findFirst: mocks.waitlistFindFirst,
      create: mocks.waitlistCreate,
      update: mocks.waitlistUpdate,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mocks.sendEmail,
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
}));

function request(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/waitlist", {
    method: "POST",
    headers: {
      "x-request-id": "req_public_waitlist",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify({
      name: "Asha Sharma",
      email: "asha@example.com",
      phone: "+919999999999",
      courseSlug: "200hr",
      ...body,
    }),
  });
}

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/waitlist", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_admin_waitlist",
      origin: "https://example.com",
      host: "example.com",
    },
    body: JSON.stringify(body),
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
  mocks.waitlistFindFirst.mockResolvedValue(null);
  mocks.batchFindUnique.mockResolvedValue({ id: "batch_1", status: "FULL" });
  mocks.waitlistCreate.mockResolvedValue({
    id: "waitlist_1",
    name: "Asha Sharma",
    email: "asha@example.com",
    priority: 0,
    status: "WAITING",
  });
  mocks.waitlistUpdate.mockResolvedValue({
    id: "waitlist_1",
    status: "NOTIFIED",
    priority: 5,
    notes: "Call tomorrow",
  });
  mocks.sendEmail.mockResolvedValue({ success: true });
});

describe("public waitlist route", () => {
  it("creates a waitlist entry with server-controlled priority", async () => {
    const response = await POST(request({
      name: "  Asha Sharma  ",
      email: " ASHA@Example.COM ",
      phone: " +919999999999 ",
      courseSlug: " 200hr ",
      batchId: " batch_1 ",
      priority: 999,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_waitlist");
    expect(body.success).toBe(true);
    expect(mocks.waitlistCreate).toHaveBeenCalledWith({
      data: {
        name: "Asha Sharma",
        email: "asha@example.com",
        phone: "+919999999999",
        courseSlug: "200hr",
        batchId: "batch_1",
        priority: 0,
        status: "WAITING",
      },
    });
  });

  it("rejects invalid public waitlist payloads before writing", async () => {
    const response = await POST(request({ email: "not-an-email", name: "", courseSlug: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.waitlistCreate).not.toHaveBeenCalled();
  });

  it("validates admin waitlist updates and writes an audit log", async () => {
    const response = await PATCH(patchRequest({
      id: " waitlist_1 ",
      status: "NOTIFIED",
      priority: 5,
      notes: " Call tomorrow ",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.waitlistUpdate).toHaveBeenCalledWith({
      where: { id: "waitlist_1" },
      data: {
        status: "NOTIFIED",
        priority: 5,
        notes: "Call tomorrow",
        notifiedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: "admin_1",
      action: "waitlist.updated",
      entity: "waitlist",
      entityId: "waitlist_1",
    }));
  });

  it("rejects invalid admin waitlist updates before writing", async () => {
    const response = await PATCH(patchRequest({ id: "waitlist_1", status: "INVALID", priority: 101 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.waitlistUpdate).not.toHaveBeenCalled();
  });

  it("does not add a waitlist entry when the batch is open", async () => {
    mocks.batchFindUnique.mockResolvedValue({ id: "batch_1", status: "OPEN" });

    const response = await POST(request({ batchId: "batch_1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "Spots available! Direct enrollment recommended.",
      directEnrollment: true,
    });
    expect(mocks.waitlistCreate).not.toHaveBeenCalled();
  });

  it("rate limits public waitlist attempts", async () => {
    mocks.rateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 30_000 });

    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(body.error).toBe("Too many waitlist attempts. Try again later.");
    expect(mocks.waitlistCreate).not.toHaveBeenCalled();
  });

  it("logs failures without leaking internals", async () => {
    mocks.waitlistCreate.mockRejectedValue(new Error("database down"));

    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to join waitlist");
    expect(mocks.logApiError).toHaveBeenCalledWith("waitlist.create", expect.any(Error), expect.any(NextRequest));
  });
});
