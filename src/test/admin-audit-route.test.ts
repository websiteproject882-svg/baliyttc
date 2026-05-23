import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/admin/audit/route";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  auditFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    auditLog: {
      findMany: mocks.auditFindMany,
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
  role: "SUPER_ADMIN",
  permissions: ["admin"],
  authType: "admin",
};

const auditLog = {
  id: "audit_1",
  action: "course.created",
  entity: "course",
  entityId: "course_1",
  oldValue: null,
  newValue: { name: "200 Hour YTT" },
  ipAddress: "127.0.0.1",
  userAgent: "vitest",
  createdAt: new Date("2026-05-20T00:00:00.000Z"),
  user: {
    email: "admin@example.com",
    displayName: "Admin One",
  },
};

function request(url = "https://example.com/api/admin/audit") {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "x-request-id": "req_admin_audit",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSuperAdmin.mockResolvedValue({ user: admin, response: null });
  mocks.auditFindMany.mockResolvedValue([auditLog]);
});

describe("admin audit route", () => {
  it("lists audit logs with filters, bounded limit, and request id", async () => {
    const response = await GET(
      request("https://example.com/api/admin/audit?limit=25&entity=course&action=course.created&actor=admin"),
    );
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requireSuperAdmin).toHaveBeenCalled();
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_audit");
    expect(body.logs).toEqual([
      {
        id: "audit_1",
        action: "course.created",
        entity: "course",
        entityId: "course_1",
        oldValue: null,
        newValue: { name: "200 Hour YTT" },
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
        createdAt: "2026-05-20T00:00:00.000Z",
        user: {
          email: "admin@example.com",
          displayName: "Admin One",
        },
      },
    ]);
    expect(mocks.auditFindMany).toHaveBeenCalledWith({
      where: {
        entity: "course",
        action: "course.created",
        user: {
          email: {
            contains: "admin",
            mode: "insensitive",
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  });

  it("uses the default limit when omitted", async () => {
    await GET(request());

    expect(mocks.auditFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it("rejects invalid limits before querying the database", async () => {
    const response = await GET(request("https://example.com/api/admin/audit?limit=bad"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.auditFindMany).not.toHaveBeenCalled();
  });

  it("caps very large limits through validation", async () => {
    const response = await GET(request("https://example.com/api/admin/audit?limit=101"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.auditFindMany).not.toHaveBeenCalled();
  });

  it("logs failures without leaking internals", async () => {
    mocks.auditFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to fetch audit logs");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.audit.list",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
