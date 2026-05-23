import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/prearrival-resources/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  preArrivalResourceFindMany: vi.fn(),
  preArrivalResourceFindUnique: vi.fn(),
  preArrivalResourceCreate: vi.fn(),
  preArrivalResourceUpdate: vi.fn(),
  preArrivalResourceDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    preArrivalResource: {
      findMany: mocks.preArrivalResourceFindMany,
      findUnique: mocks.preArrivalResourceFindUnique,
      create: mocks.preArrivalResourceCreate,
      update: mocks.preArrivalResourceUpdate,
      delete: mocks.preArrivalResourceDelete,
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
  permissions: ["prearrival.view", "prearrival.edit"],
  authType: "admin",
};

const resource = {
  id: "resource_1",
  title: "Visa Guide",
  description: "Prepare visa documents",
  url: "https://example.com/visa.pdf",
  type: "DOCUMENT",
  audience: "PRE_ARRIVAL",
  taskKey: "visa",
  order: 1,
  isActive: true,
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/prearrival-resources") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_resources",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/prearrival-resources", {
    method,
    headers: {
      "x-request-id": "req_admin_resources",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Visa Guide",
    description: "Prepare visa documents",
    url: "https://example.com/visa.pdf",
    type: "DOCUMENT",
    audience: "PRE_ARRIVAL",
    taskKey: "visa",
    order: 1,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.preArrivalResourceFindMany.mockResolvedValue([resource]);
  mocks.preArrivalResourceFindUnique.mockResolvedValue(resource);
  mocks.preArrivalResourceCreate.mockResolvedValue(resource);
  mocks.preArrivalResourceUpdate.mockResolvedValue({ ...resource, title: "Updated Guide" });
  mocks.preArrivalResourceDelete.mockResolvedValue(resource);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin pre-arrival resources route", () => {
  it("lists resources with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_resources");
    expect(body.resources).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("prearrival.view");
    expect(mocks.preArrivalResourceFindMany).toHaveBeenCalledWith({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  });

  it("creates a resource and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true, resource: expect.objectContaining({ id: "resource_1" }) });
    expect(mocks.preArrivalResourceCreate).toHaveBeenCalledWith({
      data: {
        title: "Visa Guide",
        description: "Prepare visa documents",
        url: "https://example.com/visa.pdf",
        type: "DOCUMENT",
        audience: "PRE_ARRIVAL",
        taskKey: "visa",
        order: 1,
        isActive: true,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "prearrival_resource.created",
        entity: "prearrival_resource",
        entityId: "resource_1",
      }),
    );
  });

  it("accepts relative resource URLs for local files", async () => {
    const response = await POST(request("POST", payload({ url: "/downloads/visa.pdf" })));

    expect(response?.status).toBe(200);
    expect(mocks.preArrivalResourceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ url: "/downloads/visa.pdf" }),
    });
  });

  it("rejects unsafe resource URLs", async () => {
    const response = await POST(request("POST", payload({ url: "javascript:alert(1)" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.preArrivalResourceCreate).not.toHaveBeenCalled();
  });

  it("rejects plain http resource URLs so students do not hit broken redirects", async () => {
    const response = await POST(request("POST", payload({ url: "http://example.com/visa.pdf" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.preArrivalResourceCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed resource create JSON before writes", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_resources");
    expect(body.error).toBe("Validation failed");
    expect(mocks.preArrivalResourceCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates an existing resource and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "resource_1", title: "Updated Guide" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.resource.title).toBe("Updated Guide");
    expect(mocks.preArrivalResourceUpdate).toHaveBeenCalledWith({
      where: { id: "resource_1" },
      data: expect.objectContaining({ title: "Updated Guide" }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "prearrival_resource.updated",
        oldValue: resource,
      }),
    );
  });

  it("returns 404 when updating a missing resource", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Resource not found");
    expect(mocks.preArrivalResourceUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed resource update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_resources");
    expect(body.error).toBe("Validation failed");
    expect(mocks.preArrivalResourceFindUnique).not.toHaveBeenCalled();
    expect(mocks.preArrivalResourceUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects oversized resource update ids before lookup", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "x".repeat(121), title: "Updated Guide" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.preArrivalResourceFindUnique).not.toHaveBeenCalled();
    expect(mocks.preArrivalResourceUpdate).not.toHaveBeenCalled();
  });

  it("deletes a resource and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/prearrival-resources?id=resource_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.preArrivalResourceDelete).toHaveBeenCalledWith({ where: { id: "resource_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "prearrival_resource.deleted",
        entityId: "resource_1",
        oldValue: resource,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Resource id is required");
  });

  it("rejects oversized resource delete ids before lookup", async () => {
    const response = await DELETE(
      request("DELETE", undefined, `https://example.com/api/admin/prearrival-resources?id=${"x".repeat(121)}`),
    );
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Resource id is required");
    expect(mocks.preArrivalResourceFindUnique).not.toHaveBeenCalled();
    expect(mocks.preArrivalResourceDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.preArrivalResourceDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/prearrival-resources?id=resource_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete resource");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.prearrival_resources.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { resourceId: "resource_1", userId: "admin_1" },
    );
  });
});
