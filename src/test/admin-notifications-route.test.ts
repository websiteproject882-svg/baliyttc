import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/notifications/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationFindUnique: vi.fn(),
  notificationCreate: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      findMany: mocks.notificationFindMany,
      findUnique: mocks.notificationFindUnique,
      create: mocks.notificationCreate,
      update: mocks.notificationUpdate,
      delete: mocks.notificationDelete,
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

const notification = {
  id: "notification_1",
  title: "Welcome",
  message: "Prepare for your arrival",
  type: "INFO",
  audience: "PRE_ARRIVAL",
  batchId: null,
  studentId: null,
  actionUrl: "/app/pre-arrival",
  publishedAt: new Date("2026-02-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-31T00:00:00.000Z"),
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/notifications") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_notifications",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/notifications", {
    method,
    headers: {
      "x-request-id": "req_admin_notifications",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Welcome",
    message: "Prepare for your arrival",
    type: "INFO",
    audience: "PRE_ARRIVAL",
    batchId: "",
    studentId: "",
    actionUrl: "/app/pre-arrival",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.notificationFindMany.mockResolvedValue([notification]);
  mocks.notificationFindUnique.mockResolvedValue(notification);
  mocks.notificationCreate.mockResolvedValue(notification);
  mocks.notificationUpdate.mockResolvedValue({ ...notification, title: "Updated" });
  mocks.notificationDelete.mockResolvedValue(notification);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin notifications route", () => {
  it("lists recent notifications with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_notifications");
    expect(body.notifications).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.view");
    expect(mocks.notificationFindMany).toHaveBeenCalledWith({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  });

  it("creates notifications and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.create");
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        title: "Welcome",
        message: "Prepare for your arrival",
        type: "INFO",
        audience: "PRE_ARRIVAL",
        batchId: null,
        studentId: null,
        actionUrl: "/app/pre-arrival",
        publishedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "notification.created",
        entity: "notification",
        entityId: "notification_1",
      }),
    );
  });

  it("keeps studentId only for individual notifications", async () => {
    await POST(request("POST", payload({ audience: "INDIVIDUAL", studentId: "student_1" })));

    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        audience: "INDIVIDUAL",
        studentId: "student_1",
      }),
    });
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ title: "No" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed notification create JSON before writes", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_notifications");
    expect(body.error).toBe("Validation failed");
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates existing notifications and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "notification_1", title: "Updated" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.notification.title).toBe("Updated");
    expect(mocks.requirePermission).toHaveBeenCalledWith("announcements.edit");
    expect(mocks.notificationUpdate).toHaveBeenCalledWith({
      where: { id: "notification_1" },
      data: expect.objectContaining({
        title: "Updated",
        studentId: null,
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "notification.updated",
        oldValue: notification,
      }),
    );
  });

  it("returns 404 when updating a missing notification", async () => {
    mocks.notificationFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Notification not found");
    expect(mocks.notificationUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed notification update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_notifications");
    expect(body.error).toBe("Validation failed");
    expect(mocks.notificationFindUnique).not.toHaveBeenCalled();
    expect(mocks.notificationUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects oversized notification update ids before lookup", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "x".repeat(121), title: "Updated" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.notificationFindUnique).not.toHaveBeenCalled();
    expect(mocks.notificationUpdate).not.toHaveBeenCalled();
  });

  it("deletes notifications and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/notifications?id=notification_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.notificationDelete).toHaveBeenCalledWith({ where: { id: "notification_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "notification.deleted",
        entityId: "notification_1",
        oldValue: notification,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Notification id is required");
  });

  it("rejects oversized notification delete ids before lookup", async () => {
    const response = await DELETE(
      request("DELETE", undefined, `https://example.com/api/admin/notifications?id=${"x".repeat(121)}`),
    );
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Notification id is required");
    expect(mocks.notificationFindUnique).not.toHaveBeenCalled();
    expect(mocks.notificationDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.notificationDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/notifications?id=notification_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete notification");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.notifications.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { notificationId: "notification_1", userId: "admin_1" },
    );
  });
});
