import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getLeads, PATCH as patchLead } from "../app/api/leads/route";
import { DELETE as deleteWaitlist, GET as getWaitlist, PATCH as patchWaitlist } from "../app/api/waitlist/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  leadFindMany: vi.fn(),
  leadCount: vi.fn(),
  leadFindUnique: vi.fn(),
  leadUpdate: vi.fn(),
  waitlistFindMany: vi.fn(),
  waitlistCount: vi.fn(),
  waitlistUpdate: vi.fn(),
  waitlistFindUnique: vi.fn(),
  waitlistDelete: vi.fn(),
  logApiError: vi.fn(),
  logLegacyRouteAccess: vi.fn(),
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
      findUnique: mocks.leadFindUnique,
      update: mocks.leadUpdate,
    },
    waitlist: {
      findMany: mocks.waitlistFindMany,
      count: mocks.waitlistCount,
      update: mocks.waitlistUpdate,
      findUnique: mocks.waitlistFindUnique,
      delete: mocks.waitlistDelete,
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  LEGACY_API_SUNSET: "2026-08-31",
  applyDeprecationHeaders: (response: Response) => response,
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  jsonWithRequestId: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  logApiError: mocks.logApiError,
  logLegacyRouteAccess: mocks.logLegacyRouteAccess,
  rateLimit: vi.fn(() => ({ allowed: true, resetAt: Date.now() + 1000 })),
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin",
  role: "SUPER_ADMIN",
  permissions: ["*"],
  authType: "admin",
};

function request(method: "GET" | "PATCH" | "DELETE", url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: {
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.leadFindMany.mockResolvedValue([{ id: "lead_1" }]);
  mocks.leadCount.mockResolvedValue(1);
  mocks.leadFindUnique.mockResolvedValue({ id: "lead_1", status: "NEW" });
  mocks.leadUpdate.mockResolvedValue({ id: "lead_1", status: "CONTACTED" });
  mocks.waitlistFindMany.mockResolvedValue([{ id: "wait_1" }]);
  mocks.waitlistCount.mockResolvedValue(1);
  mocks.waitlistUpdate.mockResolvedValue({ id: "wait_1", status: "NOTIFIED" });
  mocks.waitlistFindUnique.mockResolvedValue({ id: "wait_1", status: "WAITING" });
  mocks.waitlistDelete.mockResolvedValue({ id: "wait_1" });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("legacy management routes", () => {
  it("uses lead permissions for legacy lead management", async () => {
    await getLeads(request("GET", "https://example.com/api/leads?status=NEW"));
    await patchLead(request("PATCH", "https://example.com/api/leads", { id: "lead_1", status: "CONTACTED" }));

    expect(mocks.requirePermission).toHaveBeenNthCalledWith(1, "leads.view");
    expect(mocks.requirePermission).toHaveBeenNthCalledWith(2, "leads.edit");
    expect(mocks.leadFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "NEW" } }));
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "lead.updated.legacy_route" }));
  });

  it("rejects invalid legacy lead list filters before querying", async () => {
    const response = await getLeads(request("GET", "https://example.com/api/leads?status=bad"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadFindMany).not.toHaveBeenCalled();
    expect(mocks.leadCount).not.toHaveBeenCalled();
  });

  it("rejects oversized legacy lead update ids before lookup", async () => {
    const response = await patchLead(
      request("PATCH", "https://example.com/api/leads", { id: "x".repeat(121), status: "CONTACTED" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadFindUnique).not.toHaveBeenCalled();
    expect(mocks.leadUpdate).not.toHaveBeenCalled();
  });

  it("uses waitlist permissions for legacy waitlist management", async () => {
    await getWaitlist(request("GET", "https://example.com/api/waitlist?status=WAITING&course=200hr"));
    await patchWaitlist(request("PATCH", "https://example.com/api/waitlist", { id: "wait_1", status: "NOTIFIED" }));
    await deleteWaitlist(request("DELETE", "https://example.com/api/waitlist?id=wait_1"));

    expect(mocks.requirePermission).toHaveBeenNthCalledWith(1, "waitlist.view");
    expect(mocks.requirePermission).toHaveBeenNthCalledWith(2, "waitlist.edit");
    expect(mocks.requirePermission).toHaveBeenNthCalledWith(3, "waitlist.edit");
    expect(mocks.waitlistFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "WAITING", courseSlug: "200hr" } }),
    );
  });

  it("rejects invalid waitlist list filters before querying", async () => {
    const response = await getWaitlist(request("GET", "https://example.com/api/waitlist?status=bad&course=200hr"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.waitlistFindMany).not.toHaveBeenCalled();
    expect(mocks.waitlistCount).not.toHaveBeenCalled();
  });

  it("rejects oversized waitlist delete ids before lookup", async () => {
    const response = await deleteWaitlist(request("DELETE", `https://example.com/api/waitlist?id=${"x".repeat(121)}`));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("id is required");
    expect(mocks.waitlistFindUnique).not.toHaveBeenCalled();
    expect(mocks.waitlistDelete).not.toHaveBeenCalled();
  });

  it("returns permission errors before reading legacy lead data", async () => {
    const forbidden = Response.json({ error: "Forbidden" }, { status: 403 });
    mocks.requirePermission.mockResolvedValue({ user: null, response: forbidden });

    const response = await getLeads(request("GET", "https://example.com/api/leads"));

    expect(response.status).toBe(403);
    expect(mocks.leadFindMany).not.toHaveBeenCalled();
  });
});
