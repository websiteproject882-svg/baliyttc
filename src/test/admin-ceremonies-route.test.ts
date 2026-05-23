import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/ceremonies/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  scheduleFindMany: vi.fn(),
  scheduleCreate: vi.fn(),
  scheduleUpdate: vi.fn(),
  scheduleDelete: vi.fn(),
  batchFindFirst: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    scheduleEntry: {
      findMany: mocks.scheduleFindMany,
      create: mocks.scheduleCreate,
      update: mocks.scheduleUpdate,
      delete: mocks.scheduleDelete,
    },
    batch: {
      findFirst: mocks.batchFindFirst,
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
  permissions: ["admin"],
  authType: "admin",
};

const ceremony = {
  id: "ceremony_1",
  date: new Date("2026-06-01T00:00:00.000Z"),
  dayNumber: 0,
  activities: [],
  ceremonyBlocked: true,
  notes: "Full Moon Ceremony",
  batchId: "batch_1",
};

function request(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
  url = "https://example.com/api/admin/ceremonies",
) {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_ceremonies",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Full Moon Ceremony",
    date: "2026-06-01",
    description: "No regular classes.",
    type: "full_moon",
    noClass: true,
    batchIds: ["batch_1"],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.scheduleFindMany.mockResolvedValue([ceremony]);
  mocks.scheduleCreate.mockResolvedValue(ceremony);
  mocks.scheduleUpdate.mockResolvedValue({ ...ceremony, notes: "Updated Ceremony" });
  mocks.scheduleDelete.mockResolvedValue(ceremony);
  mocks.batchFindFirst.mockResolvedValue({ id: "batch_fallback" });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

function notFoundError() {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "test",
  });
}

describe("admin ceremonies route", () => {
  it("lists ceremony schedule entries with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_ceremonies");
    expect(mocks.requirePermission).toHaveBeenCalledWith("ceremonies.view");
    expect(body.ceremonies).toEqual([
      {
        id: "ceremony_1",
        name: "Full Moon Ceremony",
        date: "2026-06-01",
        description: "Full Moon Ceremony",
        type: "temple",
        noClass: true,
        batchIds: ["batch_1"],
      },
    ]);
    expect(mocks.scheduleFindMany).toHaveBeenCalledWith({
      where: { ceremonyBlocked: true },
      orderBy: { date: "asc" },
    });
  });

  it("creates ceremonies from date-only form values and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("ceremonies.create");
    expect(body.ceremony.batchIds).toEqual(["batch_1"]);
    expect(mocks.scheduleCreate).toHaveBeenCalledWith({
      data: {
        date: new Date("2026-06-01T00:00:00.000Z"),
        dayNumber: 0,
        activities: [],
        ceremonyBlocked: true,
        notes: "Full Moon Ceremony",
        batchId: "batch_1",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "ceremony.created",
        entity: "scheduleEntry",
        entityId: "ceremony_1",
      }),
    );
  });

  it("uses the next batch when the calendar form sends no batch ids", async () => {
    await POST(request("POST", payload({ batchIds: [] })));

    expect(mocks.batchFindFirst).toHaveBeenCalledWith({
      orderBy: { startDate: "asc" },
      select: { id: true },
    });
    expect(mocks.scheduleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        batchId: "batch_fallback",
      }),
    });
  });

  it("returns 400 when no batch exists for fallback creation", async () => {
    mocks.batchFindFirst.mockResolvedValue(null);

    const response = await POST(request("POST", payload({ batchIds: [] })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("At least one batch is required before adding ceremonies");
    expect(mocks.scheduleCreate).not.toHaveBeenCalled();
  });

  it("validates invalid dates before creating ceremonies", async () => {
    const response = await POST(request("POST", payload({ date: "not-a-date" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.scheduleCreate).not.toHaveBeenCalled();
  });

  it("updates ceremonies and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "ceremony_1", name: "Updated Ceremony" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("ceremonies.edit");
    expect(body.success).toBe(true);
    expect(mocks.scheduleUpdate).toHaveBeenCalledWith({
      where: { id: "ceremony_1" },
      data: {
        date: new Date("2026-06-01T00:00:00.000Z"),
        notes: "Updated Ceremony",
        batchId: "batch_1",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ceremony.updated",
        entityId: "ceremony_1",
      }),
    );
  });

  it("returns 404 when updating a missing ceremony", async () => {
    mocks.scheduleUpdate.mockRejectedValue(notFoundError());

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Ceremony not found");
  });

  it("deletes ceremonies and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/ceremonies?id=ceremony_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("ceremonies.edit");
    expect(body).toEqual({ success: true });
    expect(mocks.scheduleDelete).toHaveBeenCalledWith({ where: { id: "ceremony_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ceremony.deleted",
        entityId: "ceremony_1",
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Ceremony id is required");
  });

  it("logs list failures without leaking internals", async () => {
    mocks.scheduleFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to fetch ceremonies");
    expect(mocks.logApiError).toHaveBeenCalledWith("admin.ceremonies.list", expect.any(Error), expect.any(NextRequest));
  });
});
