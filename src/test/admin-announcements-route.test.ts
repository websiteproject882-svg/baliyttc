import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/announcements/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  announcementFindMany: vi.fn(),
  announcementFindUnique: vi.fn(),
  announcementCreate: vi.fn(),
  announcementUpdate: vi.fn(),
  announcementDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    announcement: {
      findMany: mocks.announcementFindMany,
      findUnique: mocks.announcementFindUnique,
      create: mocks.announcementCreate,
      update: mocks.announcementUpdate,
      delete: mocks.announcementDelete,
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
  permissions: ["announcements.view", "announcements.create", "announcements.edit"],
  authType: "admin",
};

const announcement = {
  id: "announcement_1",
  title: "Welcome",
  content: "Welcome to your Bali training batch.",
  type: "GENERAL",
  batchId: null,
  authorId: "admin_1",
  publishedAt: new Date("2026-02-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-31T00:00:00.000Z"),
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/announcements") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_announcements",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/announcements", {
    method,
    headers: {
      "x-request-id": "req_admin_announcements",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Welcome",
    content: "Welcome to your Bali training batch.",
    type: "GENERAL",
    batchId: "",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.announcementFindMany.mockResolvedValue([announcement]);
  mocks.announcementFindUnique.mockResolvedValue(announcement);
  mocks.announcementCreate.mockResolvedValue(announcement);
  mocks.announcementUpdate.mockResolvedValue({ ...announcement, title: "Updated" });
  mocks.announcementDelete.mockResolvedValue(announcement);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin announcements route", () => {
  it("lists recent announcements with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_announcements");
    expect(body.announcements).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.view");
    expect(mocks.announcementFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });

  it("creates announcements and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.create");
    expect(mocks.announcementCreate).toHaveBeenCalledWith({
      data: {
        title: "Welcome",
        content: "Welcome to your Bali training batch.",
        type: "GENERAL",
        batchId: null,
        authorId: "admin_1",
        publishedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "announcement.created",
        entity: "announcement",
        entityId: "announcement_1",
      }),
    );
  });

  it("creates batch-targeted announcements", async () => {
    await POST(request("POST", payload({ type: "BATCH", batchId: "batch_1" })));

    expect(mocks.announcementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "BATCH",
        batchId: "batch_1",
      }),
    });
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ content: "short" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed announcement create JSON before writes", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_announcements");
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates existing announcements and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "announcement_1", title: "Updated" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.announcement.title).toBe("Updated");
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.edit");
    expect(mocks.announcementUpdate).toHaveBeenCalledWith({
      where: { id: "announcement_1" },
      data: {
        title: "Updated",
        content: "Welcome to your Bali training batch.",
        type: "GENERAL",
        batchId: null,
        publishedAt: announcement.publishedAt,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "announcement.updated",
        oldValue: announcement,
      }),
    );
  });

  it("sets publishedAt when updating an unpublished announcement", async () => {
    mocks.announcementFindUnique.mockResolvedValue({ ...announcement, publishedAt: null });

    await PATCH(request("PATCH", payload({ id: "announcement_1" })));

    expect(mocks.announcementUpdate).toHaveBeenCalledWith({
      where: { id: "announcement_1" },
      data: expect.objectContaining({
        publishedAt: expect.any(Date),
      }),
    });
  });

  it("returns 404 when updating a missing announcement", async () => {
    mocks.announcementFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Announcement not found");
    expect(mocks.announcementUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed announcement update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_announcements");
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementFindUnique).not.toHaveBeenCalled();
    expect(mocks.announcementUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("deletes announcements and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/announcements?id=announcement_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.announcementDelete).toHaveBeenCalledWith({ where: { id: "announcement_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "announcement.deleted",
        entityId: "announcement_1",
        oldValue: announcement,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Announcement id is required");
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.announcementDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/announcements?id=announcement_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete announcement");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.announcements.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { announcementId: "announcement_1", userId: "admin_1" },
    );
  });
});
