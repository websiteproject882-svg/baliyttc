import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH } from "../app/api/admin/waitlist/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  waitlistFindMany: vi.fn(),
  waitlistFindUnique: vi.fn(),
  waitlistUpdate: vi.fn(),
  waitlistDelete: vi.fn(),
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
      findMany: mocks.waitlistFindMany,
      findUnique: mocks.waitlistFindUnique,
      update: mocks.waitlistUpdate,
      delete: mocks.waitlistDelete,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: ["waitlist.view", "waitlist.edit"],
  authType: "admin",
};

const entry = {
  id: "waitlist_1",
  name: "Asha Sharma",
  email: "asha@example.com",
  phone: "+919999999999",
  courseSlug: "200hr",
  batchId: "batch_1",
  priority: 5,
  status: "WAITING",
  notes: null,
  notifiedAt: null,
  convertedAt: null,
  convertedEnrollmentId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function request(method: "GET" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/waitlist") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_waitlist",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: "waitlist_1",
    status: "NOTIFIED",
    notes: "Seat may open next week.",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.waitlistFindMany.mockResolvedValue([entry]);
  mocks.waitlistFindUnique.mockResolvedValue(entry);
  mocks.waitlistUpdate.mockResolvedValue({ ...entry, status: "NOTIFIED" });
  mocks.waitlistDelete.mockResolvedValue(entry);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin waitlist route", () => {
  it("lists waitlist entries with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_waitlist");
    expect(body.waitlist).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("waitlist.view");
    expect(mocks.waitlistFindMany).toHaveBeenCalledWith({
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });
  });

  it("marks entries as notified and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.waitlist.status).toBe("NOTIFIED");
    expect(mocks.requirePermission).toHaveBeenCalledWith("waitlist.edit");
    expect(mocks.waitlistUpdate).toHaveBeenCalledWith({
      where: { id: "waitlist_1" },
      data: {
        status: "NOTIFIED",
        notes: "Seat may open next week.",
        notifiedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "waitlist.status_updated",
        oldValue: entry,
      }),
    );
  });

  it("sets convertedAt when converting entries", async () => {
    await PATCH(request("PATCH", payload({ status: "CONVERTED", notes: undefined })));

    expect(mocks.waitlistUpdate).toHaveBeenCalledWith({
      where: { id: "waitlist_1" },
      data: {
        status: "CONVERTED",
        convertedAt: expect.any(Date),
      },
    });
  });

  it("allows clearing notes", async () => {
    await PATCH(request("PATCH", payload({ notes: null })));

    expect(mocks.waitlistUpdate).toHaveBeenCalledWith({
      where: { id: "waitlist_1" },
      data: expect.objectContaining({
        notes: null,
      }),
    });
  });

  it("validates update payloads", async () => {
    const response = await PATCH(request("PATCH", payload({ status: "UNKNOWN" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.waitlistUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a missing entry", async () => {
    mocks.waitlistFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Waitlist entry not found");
    expect(mocks.waitlistUpdate).not.toHaveBeenCalled();
  });

  it("deletes waitlist entries and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/waitlist?id=waitlist_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.waitlistDelete).toHaveBeenCalledWith({ where: { id: "waitlist_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "waitlist.deleted",
        entityId: "waitlist_1",
        oldValue: entry,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Waitlist entry id is required");
  });

  it("returns 404 when deleting a missing entry", async () => {
    mocks.waitlistFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/waitlist?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Waitlist entry not found");
    expect(mocks.waitlistDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.waitlistDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/waitlist?id=waitlist_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete waitlist entry");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.waitlist.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
