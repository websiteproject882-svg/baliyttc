import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/batches/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  batchFindMany: vi.fn(),
  batchFindUnique: vi.fn(),
  batchCreate: vi.fn(),
  batchUpdate: vi.fn(),
  batchDelete: vi.fn(),
  accommodationDeleteMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    batch: {
      findMany: mocks.batchFindMany,
      findUnique: mocks.batchFindUnique,
      create: mocks.batchCreate,
      update: mocks.batchUpdate,
      delete: mocks.batchDelete,
    },
    accommodation: {
      deleteMany: mocks.accommodationDeleteMany,
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
  permissions: ["batches.view", "batches.create", "batches.edit"],
  authType: "admin",
};

const batch = {
  id: "batch_1",
  courseId: "course_1",
  name: "March 2026",
  startDate: new Date("2026-03-01T00:00:00.000Z"),
  endDate: new Date("2026-03-21T00:00:00.000Z"),
  capacity: 20,
  enrolled: 3,
  priceRegular: 1499,
  priceEarlyBird: 1299,
  earlyBirdDeadline: new Date("2026-01-31T00:00:00.000Z"),
  status: "OPEN",
  waitlistEnabled: true,
  course: { id: "course_1", title: "200 Hour YTT" },
  accommodation: [{ id: "room_1", batchId: "batch_1", type: "SHARED", price: 0, mandatory: true }],
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/batches") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_batches",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/batches", {
    method,
    headers: {
      "x-request-id": "req_admin_batches",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    courseId: "course_1",
    name: "March 2026",
    startDate: "2026-03-01",
    endDate: "2026-03-21",
    capacity: 20,
    priceRegular: 1499,
    priceEarlyBird: 1299,
    earlyBirdDeadline: "2026-01-31",
    status: "OPEN",
    waitlistEnabled: true,
    accommodation: [{ type: "SHARED", price: 0, mandatory: true }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.batchFindMany.mockResolvedValue([batch]);
  mocks.batchFindUnique.mockResolvedValue(batch);
  mocks.batchCreate.mockResolvedValue(batch);
  mocks.batchUpdate.mockResolvedValue({ ...batch, name: "Updated March 2026" });
  mocks.batchDelete.mockResolvedValue(batch);
  mocks.accommodationDeleteMany.mockResolvedValue({ count: 1 });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin batches route", () => {
  it("lists batches with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_batches");
    expect(body.batches).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("batches.view");
    expect(mocks.batchFindMany).toHaveBeenCalledWith({
      include: {
        course: true,
        accommodation: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });
  });

  it("creates batches with accommodation and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("batches.create");
    expect(mocks.batchCreate).toHaveBeenCalledWith({
      data: {
        courseId: "course_1",
        name: "March 2026",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        capacity: 20,
        enrolled: 0,
        priceRegular: 1499,
        priceEarlyBird: 1299,
        earlyBirdDeadline: expect.any(Date),
        status: "OPEN",
        waitlistEnabled: true,
        accommodation: {
          create: [{ type: "SHARED", price: 0, mandatory: true }],
        },
      },
      include: { course: true, accommodation: true },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "batch.created",
        entity: "batch",
        entityId: "batch_1",
      }),
    );
  });

  it("validates date order before creating batches", async () => {
    const response = await POST(request("POST", payload({ endDate: "2026-02-20" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.batchCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed batch create JSON before saving", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_batches");
    expect(body.error).toBe("Validation failed");
    expect(mocks.batchCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates batches, replaces accommodation, and preserves enrolled count", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "batch_1", name: "Updated March 2026" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.batch.name).toBe("Updated March 2026");
    expect(mocks.requirePermission).toHaveBeenCalledWith("batches.edit");
    expect(mocks.accommodationDeleteMany).toHaveBeenCalledWith({ where: { batchId: "batch_1" } });
    expect(mocks.batchUpdate).toHaveBeenCalledWith({
      where: { id: "batch_1" },
      data: expect.objectContaining({
        name: "Updated March 2026",
        enrolled: 3,
        accommodation: {
          create: [{ type: "SHARED", price: 0, mandatory: true }],
        },
      }),
      include: { course: true, accommodation: true },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "batch.updated",
        oldValue: batch,
      }),
    );
  });

  it("allows explicitly updating enrolled count", async () => {
    await PATCH(request("PATCH", payload({ id: "batch_1", enrolled: 8 })));

    expect(mocks.batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ enrolled: 8 }),
      }),
    );
  });

  it("returns 404 when updating a missing batch", async () => {
    mocks.batchFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Batch not found");
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed batch update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_batches");
    expect(body.error).toBe("Validation failed");
    expect(mocks.batchFindUnique).not.toHaveBeenCalled();
    expect(mocks.accommodationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects oversized batch update ids before lookup", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "x".repeat(121), name: "Updated March 2026" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.batchFindUnique).not.toHaveBeenCalled();
    expect(mocks.accommodationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("deletes batches and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/batches?id=batch_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.batchDelete).toHaveBeenCalledWith({ where: { id: "batch_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "batch.deleted",
        entityId: "batch_1",
        oldValue: batch,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Batch id is required");
  });

  it("rejects oversized batch delete ids before lookup", async () => {
    const response = await DELETE(request("DELETE", undefined, `https://example.com/api/admin/batches?id=${"x".repeat(121)}`));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Batch id is required");
    expect(mocks.batchFindUnique).not.toHaveBeenCalled();
    expect(mocks.batchDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when deleting a missing batch", async () => {
    mocks.batchFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/batches?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Batch not found");
    expect(mocks.batchDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.batchDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/batches?id=batch_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete batch");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.batches.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
