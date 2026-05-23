import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "../app/api/teacher/announcements/route";

const mocks = vi.hoisted(() => ({
  currentUserHasPermission: vi.fn(),
  requireStaffUser: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  announcementFindMany: vi.fn(),
  announcementCreate: vi.fn(),
  announcementFindUnique: vi.fn(),
  announcementDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  currentUserHasPermission: mocks.currentUserHasPermission,
  requireStaffUser: mocks.requireStaffUser,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    announcement: {
      findMany: mocks.announcementFindMany,
      create: mocks.announcementCreate,
      findUnique: mocks.announcementFindUnique,
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

const teacher = {
  id: "teacher_user",
  email: "teacher@example.com",
  displayName: "Teacher",
  role: "TEACHER",
  permissions: [],
  authType: "staff",
};

const announcement = {
  id: "announcement_1",
  title: "Welcome",
  content: "Class starts at 8am",
  type: "GENERAL",
  batchId: "batch_1",
  authorId: "teacher_user",
};

function request(method: "GET" | "POST" | "DELETE", body?: unknown, url = "https://example.com/api/teacher/announcements?batchId=batch_1") {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_teacher_announcements",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function rawRequest(method: "POST", body: string) {
  return new NextRequest("https://example.com/api/teacher/announcements", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_teacher_announcements",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStaffUser.mockResolvedValue({ user: teacher, response: null });
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.currentUserHasPermission.mockReturnValue(false);
  mocks.writeAuditLog.mockResolvedValue(undefined);
  mocks.announcementFindMany.mockResolvedValue([announcement]);
  mocks.announcementCreate.mockResolvedValue(announcement);
  mocks.announcementFindUnique.mockResolvedValue(announcement);
  mocks.announcementDelete.mockResolvedValue(announcement);
});

describe("teacher announcements route", () => {
  it("lists announcements for teachers with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_announcements");
    expect(body.announcements).toEqual([announcement]);
    expect(mocks.announcementFindMany).toHaveBeenCalledWith({
      where: { batchId: "batch_1" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  });

  it("requires a staff session before listing announcements", async () => {
    const unauthorized = Response.json({ error: "Unauthorized" }, { status: 401 });
    mocks.requireStaffUser.mockResolvedValue({ user: null, response: unauthorized });

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mocks.currentUserHasPermission).not.toHaveBeenCalled();
    expect(mocks.announcementFindMany).not.toHaveBeenCalled();
  });

  it("rejects oversized batch filters before listing announcements", async () => {
    const response = await GET(
      request("GET", undefined, `https://example.com/api/teacher/announcements?batchId=${"x".repeat(121)}`),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementFindMany).not.toHaveBeenCalled();
  });

  it("creates trimmed announcements and writes an audit log", async () => {
    const response = await POST(request("POST", {
      title: "  Welcome  ",
      content: "  Class starts at 8am  ",
      type: "BATCH",
      batchId: "batch_1",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.announcementCreate).toHaveBeenCalledWith({
      data: {
        title: "Welcome",
        content: "Class starts at 8am",
        type: "BATCH",
        batchId: "batch_1",
        authorId: "teacher_user",
        publishedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "teacher_user",
        action: "teacher.announcement.created",
        entity: "announcement",
        entityId: "announcement_1",
      }),
    );
  });

  it("rejects invalid create payloads before writing", async () => {
    const response = await POST(request("POST", { title: "", content: "x" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed create JSON before writing", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_announcements");
    expect(body.error).toBe("Validation failed");
    expect(mocks.announcementCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("only lets teachers delete their own announcements", async () => {
    mocks.announcementFindUnique.mockResolvedValue({ ...announcement, authorId: "other_user" });

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/teacher/announcements?id=announcement_1"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mocks.announcementDelete).not.toHaveBeenCalled();
  });

  it("rejects oversized delete ids before lookup", async () => {
    const response = await DELETE(
      request("DELETE", undefined, `https://example.com/api/teacher/announcements?id=${"x".repeat(121)}`),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid id");
    expect(mocks.announcementFindUnique).not.toHaveBeenCalled();
    expect(mocks.announcementDelete).not.toHaveBeenCalled();
  });

  it("deletes own announcements and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/teacher/announcements?id=announcement_1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.announcementDelete).toHaveBeenCalledWith({ where: { id: "announcement_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "teacher.announcement.deleted",
        entityId: "announcement_1",
        oldValue: announcement,
      }),
    );
  });

  it("logs list failures without exposing internals", async () => {
    mocks.announcementFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch announcements" });
    expect(mocks.logApiError).toHaveBeenCalledWith("teacher.announcements.list", expect.any(Error), expect.any(NextRequest));
  });
});
