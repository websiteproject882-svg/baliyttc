import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/teacher/schedule/route";

const mocks = vi.hoisted(() => ({
  currentUserHasPermission: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  scheduleFindMany: vi.fn(),
  scheduleCreate: vi.fn(),
  scheduleFindUnique: vi.fn(),
  scheduleUpdate: vi.fn(),
  scheduleDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  currentUserHasPermission: mocks.currentUserHasPermission,
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    scheduleEntry: {
      findMany: mocks.scheduleFindMany,
      create: mocks.scheduleCreate,
      findUnique: mocks.scheduleFindUnique,
      update: mocks.scheduleUpdate,
      delete: mocks.scheduleDelete,
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
  role: "TEACHER",
  permissions: [],
  authType: "staff",
};

const schedule = {
  id: "schedule_1",
  batchId: "batch_1",
  teacherId: "teacher_1",
  date: new Date("2026-03-01T00:00:00.000Z"),
  dayNumber: 1,
  activities: [],
  ceremonyBlocked: false,
  notes: "Opening",
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown, url = "https://example.com/api/teacher/schedule?batchId=batch_1") {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_teacher_schedule",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/teacher/schedule", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_teacher_schedule",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ user: teacher, response: null });
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.currentUserHasPermission.mockReturnValue(false);
  mocks.writeAuditLog.mockResolvedValue(undefined);
  mocks.scheduleFindMany.mockResolvedValue([schedule]);
  mocks.scheduleCreate.mockResolvedValue(schedule);
  mocks.scheduleFindUnique.mockResolvedValue(schedule);
  mocks.scheduleUpdate.mockResolvedValue({ ...schedule, notes: "Updated" });
  mocks.scheduleDelete.mockResolvedValue(schedule);
});

describe("teacher schedule route", () => {
  it("lists schedule entries with validated filters and request id", async () => {
    const response = await GET(request("GET", undefined, "https://example.com/api/teacher/schedule?batchId=batch_1&startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-02T00:00:00.000Z"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_schedule");
    expect(body.schedule).toEqual([expect.objectContaining({ id: "schedule_1" })]);
    expect(mocks.scheduleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          batchId: "batch_1",
          date: {
            gte: new Date("2026-03-01T00:00:00.000Z"),
            lte: new Date("2026-03-02T00:00:00.000Z"),
          },
        },
      }),
    );
  });

  it("rejects invalid date filters before querying", async () => {
    const response = await GET(request("GET", undefined, "https://example.com/api/teacher/schedule?startDate=not-a-date"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.scheduleFindMany).not.toHaveBeenCalled();
  });

  it("creates schedule entries and writes audit logs", async () => {
    const response = await POST(request("POST", {
      batchId: " batch_1 ",
      teacherId: "teacher_1",
      date: "2026-03-01T00:00:00.000Z",
      dayNumber: 1,
      activities: [{ title: "Asana" }],
      notes: "  Opening class  ",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.scheduleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        batchId: "batch_1",
        teacherId: "teacher_1",
        date: new Date("2026-03-01T00:00:00.000Z"),
        notes: "Opening class",
      }),
      include: { batch: { include: { course: true } } },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "schedule.created" }));
  });

  it("rejects invalid create payloads before writing", async () => {
    const response = await POST(request("POST", {
      batchId: "",
      date: "2026-03-01T00:00:00.000Z",
      dayNumber: 1,
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.scheduleCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed create JSON before writing", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_schedule");
    expect(body.error).toBe("Validation failed");
    expect(mocks.scheduleCreate).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates existing schedule entries", async () => {
    const response = await PATCH(request("PATCH", {
      id: "schedule_1",
      notes: " Updated ",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.scheduleUpdate).toHaveBeenCalledWith({
      where: { id: "schedule_1" },
      data: expect.objectContaining({ notes: "Updated" }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "schedule.updated" }));
  });

  it("rejects malformed update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_schedule");
    expect(body.error).toBe("Validation failed");
    expect(mocks.scheduleFindUnique).not.toHaveBeenCalled();
    expect(mocks.scheduleUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("deletes existing schedule entries", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/teacher/schedule?id=schedule_1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.scheduleDelete).toHaveBeenCalledWith({ where: { id: "schedule_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "schedule.deleted" }));
  });

  it("logs database failures without exposing internals", async () => {
    mocks.scheduleFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch schedule" });
    expect(mocks.logApiError).toHaveBeenCalledWith("teacher.schedule.list", expect.any(Error), expect.any(NextRequest));
  });
});
