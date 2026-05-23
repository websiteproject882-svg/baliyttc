import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../app/api/app/notifications/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationReceiptUpsert: vi.fn(),
  studentFindUnique: vi.fn(),
  studentUpdate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireStudentUser: mocks.requireStudentUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      findMany: mocks.notificationFindMany,
      findFirst: mocks.notificationFindFirst,
    },
    notificationReceipt: {
      upsert: mocks.notificationReceiptUpsert,
    },
    student: {
      findUnique: mocks.studentFindUnique,
      update: mocks.studentUpdate,
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

const user = {
  id: "user_1",
  email: "student@example.com",
  displayName: "Student One",
  role: "STUDENT",
  permissions: [],
  authType: "student",
};

const student = {
  id: "student_1",
  userId: "user_1",
  accessLevel: "PRE_ARRIVAL",
  paymentStatus: "DEPOSIT_PAID",
  batchId: "batch_1",
  enrolledCourse: "200 Hour YTTC",
};

function request(method: "GET" | "PATCH", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/app/notifications", {
    method,
    headers: {
      "x-request-id": "req_student_notifications",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "PATCH", body: string) {
  return new NextRequest("https://example.com/api/app/notifications", {
    method,
    headers: {
      "x-request-id": "req_student_notifications",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.notificationFindMany.mockResolvedValue([
    {
      id: "notification_1",
      title: "Welcome",
      message: "Arrive prepared",
      type: "INFO",
      audience: "PRE_ARRIVAL",
      batchId: null,
      studentId: null,
      actionUrl: "/app",
      publishedAt: new Date("2026-02-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-31T00:00:00.000Z"),
      receipts: [],
    },
    {
      id: "notification_2",
      title: "Packing list",
      message: "Bring notebook",
      type: "ACTION",
      audience: "INDIVIDUAL",
      batchId: null,
      studentId: "student_1",
      actionUrl: null,
      publishedAt: new Date("2026-02-02T00:00:00.000Z"),
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      receipts: [{ id: "receipt_1", readAt: new Date("2026-02-03T00:00:00.000Z") }],
    },
  ]);
  mocks.studentFindUnique.mockResolvedValue({
    emailNotificationsEnabled: true,
    browserPushEnabled: false,
  });
  mocks.studentUpdate.mockResolvedValue({
    emailNotificationsEnabled: false,
    browserPushEnabled: true,
  });
  mocks.notificationFindFirst.mockResolvedValue({ id: "notification_1" });
  mocks.notificationReceiptUpsert.mockResolvedValue({
    id: "receipt_2",
    notificationId: "notification_1",
    studentId: "student_1",
    readAt: new Date("2026-02-04T00:00:00.000Z"),
  });
});

describe("student notifications route", () => {
  it("returns notifications, unread count, preferences, and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_notifications");
    expect(body.preferences).toEqual({
      emailNotificationsEnabled: true,
      browserPushEnabled: false,
    });
    expect(body.unreadCount).toBe(1);
    expect(body.notifications).toHaveLength(2);
    expect(mocks.notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 30,
        include: expect.objectContaining({
          receipts: expect.objectContaining({
            where: { studentId: "student_1" },
            take: 1,
          }),
        }),
      }),
    );
  });

  it("updates notification preferences", async () => {
    const response = await PATCH(
      request("PATCH", {
        emailNotificationsEnabled: false,
        browserPushEnabled: true,
      }),
    );
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({
      success: true,
      preferences: {
        emailNotificationsEnabled: false,
        browserPushEnabled: true,
      },
    });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        emailNotificationsEnabled: false,
        browserPushEnabled: true,
      },
      select: {
        emailNotificationsEnabled: true,
        browserPushEnabled: true,
      },
    });
  });

  it("marks an accessible notification as read", async () => {
    const response = await PATCH(request("PATCH", { notificationId: "notification_1" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.notificationFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "notification_1",
        publishedAt: { not: null },
      }),
      select: { id: true },
    });
    expect(mocks.notificationReceiptUpsert).toHaveBeenCalledWith({
      where: {
        notificationId_studentId: {
          notificationId: "notification_1",
          studentId: "student_1",
        },
      },
      update: { readAt: expect.any(Date) },
      create: {
        notificationId: "notification_1",
        studentId: "student_1",
        readAt: expect.any(Date),
      },
    });
  });

  it("blocks unreadable notification ids", async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", { notificationId: "hidden_notification" }));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Notification not found");
    expect(mocks.notificationReceiptUpsert).not.toHaveBeenCalled();
  });

  it("validates patch payloads", async () => {
    const response = await PATCH(request("PATCH", { notificationId: "" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });

  it("rejects malformed notification JSON before reading or writing", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_notifications");
    expect(body.error).toBe("Validation failed");
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationFindFirst).not.toHaveBeenCalled();
    expect(mocks.notificationReceiptUpsert).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("logs list failures without leaking internals", async () => {
    mocks.notificationFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to load notifications");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "app.notifications.list",
      expect.any(Error),
      expect.any(NextRequest),
      { studentId: "student_1" },
    );
  });
});
