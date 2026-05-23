import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH } from "../app/api/admin/leads/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  leadFindMany: vi.fn(),
  leadCount: vi.fn(),
  leadGroupBy: vi.fn(),
  leadFindUnique: vi.fn(),
  leadUpdate: vi.fn(),
  leadDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    lead: {
      findMany: mocks.leadFindMany,
      count: mocks.leadCount,
      groupBy: mocks.leadGroupBy,
      findUnique: mocks.leadFindUnique,
      update: mocks.leadUpdate,
      delete: mocks.leadDelete,
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
  permissions: ["leads.view", "leads.edit"],
  authType: "admin",
};

const lead = {
  id: "lead_1",
  name: "Asha Sharma",
  email: "asha@example.com",
  phone: "+919999999999",
  course: "200 Hour YTT",
  source: "CONTACT",
  status: "NEW",
  notes: null,
  assignedTo: null,
  followUpAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function request(method: "GET" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/leads") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_leads",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    status: "CONTACTED",
    notes: "Asked for March batch details.",
    assignedTo: "Priya",
    followUpAt: "2026-02-01",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.leadFindMany.mockResolvedValue([lead]);
  mocks.leadCount.mockResolvedValue(1);
  mocks.leadGroupBy.mockResolvedValue([{ status: "NEW", _count: 1 }]);
  mocks.leadFindUnique.mockResolvedValue(lead);
  mocks.leadUpdate.mockResolvedValue({ ...lead, status: "CONTACTED" });
  mocks.leadDelete.mockResolvedValue(lead);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin leads route", () => {
  it("lists leads with pagination, stats, and request id", async () => {
    const response = await GET(request("GET", undefined, "https://example.com/api/admin/leads?status=NEW&page=2&limit=10"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_leads");
    expect(body.leads).toHaveLength(1);
    expect(body.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(body.stats).toEqual({ NEW: 1 });
    expect(mocks.requirePermission).toHaveBeenCalledWith("leads.view");
    expect(mocks.leadFindMany).toHaveBeenCalledWith({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
    });
    expect(mocks.leadCount).toHaveBeenCalledWith({ where: { status: "NEW" } });
    expect(mocks.leadGroupBy).toHaveBeenCalledWith({
      by: ["status"],
      _count: true,
    });
  });

  it("clamps invalid pagination values", async () => {
    await GET(request("GET", undefined, "https://example.com/api/admin/leads?page=-3&limit=500"));

    expect(mocks.leadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
      }),
    );
  });

  it("updates existing leads and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.lead.status).toBe("CONTACTED");
    expect(mocks.requirePermission).toHaveBeenCalledWith("leads.edit");
    expect(mocks.leadUpdate).toHaveBeenCalledWith({
      where: { id: "lead_1" },
      data: {
        status: "CONTACTED",
        notes: "Asked for March batch details.",
        assignedTo: "Priya",
        followUpAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "lead.updated",
        oldValue: lead,
      }),
    );
  });

  it("clears nullable lead fields", async () => {
    await PATCH(request("PATCH", payload({ notes: null, assignedTo: null, followUpAt: "" })));

    expect(mocks.leadUpdate).toHaveBeenCalledWith({
      where: { id: "lead_1" },
      data: expect.objectContaining({
        notes: null,
        assignedTo: null,
        followUpAt: null,
      }),
    });
  });

  it("validates invalid follow-up dates", async () => {
    const response = await PATCH(request("PATCH", payload({ followUpAt: "not-a-date" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a missing lead", async () => {
    mocks.leadFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Lead not found");
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("deletes leads and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/leads?id=lead_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.leadDelete).toHaveBeenCalledWith({ where: { id: "lead_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "lead.deleted",
        entityId: "lead_1",
        oldValue: lead,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Lead id is required");
  });

  it("returns 404 when deleting a missing lead", async () => {
    mocks.leadFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/leads?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Lead not found");
    expect(mocks.leadDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.leadDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/leads?id=lead_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete lead");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.leads.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
