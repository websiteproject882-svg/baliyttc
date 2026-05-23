import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, POST } from "../app/api/app/announcements/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  announcementFindMany: vi.fn(),
  announcementFindUnique: vi.fn(),
  announcementReactionFindUnique: vi.fn(),
  announcementReactionDelete: vi.fn(),
  announcementReactionUpsert: vi.fn(),
  announcementReplyCreate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireStudentUser: mocks.requireStudentUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    announcement: {
      findMany: mocks.announcementFindMany,
      findUnique: mocks.announcementFindUnique,
    },
    announcementReaction: {
      findUnique: mocks.announcementReactionFindUnique,
      delete: mocks.announcementReactionDelete,
      upsert: mocks.announcementReactionUpsert,
    },
    announcementReply: {
      create: mocks.announcementReplyCreate,
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

function request(method: "GET" | "PATCH" | "POST", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/app/announcements", {
    method,
    headers: {
      "x-request-id": "req_student_announcements",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.announcementFindMany.mockResolvedValue([
    {
      id: "announcement_1",
      title: "Schedule update",
      content: "Morning class starts at 7",
      type: "BATCH",
      publishedAt: new Date("2026-02-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-31T00:00:00.000Z"),
      reactionRows: [
        { studentId: "student_1", emoji: "\u{1F64F}" },
        { studentId: "student_2", emoji: "\u{1F64F}" },
      ],
      replies: [
        {
          id: "reply_1",
          studentId: "student_1",
          content: "Thank you",
          createdAt: new Date("2026-02-01T01:00:00.000Z"),
          student: {
            user: {
              displayName: "Student One",
              photoURL: null,
            },
          },
        },
      ],
    },
  ]);
  mocks.announcementFindUnique.mockResolvedValue({
    id: "announcement_1",
    batchId: "batch_1",
    type: "BATCH",
    publishedAt: new Date("2026-02-01T00:00:00.000Z"),
  });
  mocks.announcementReactionFindUnique.mockResolvedValue(null);
  mocks.announcementReactionUpsert.mockResolvedValue({
    id: "reaction_1",
    announcementId: "announcement_1",
    studentId: "student_1",
    emoji: "\u2764\uFE0F",
  });
  mocks.announcementReactionDelete.mockResolvedValue({ id: "reaction_1" });
  mocks.announcementReplyCreate.mockResolvedValue({
    id: "reply_2",
    announcementId: "announcement_1",
    studentId: "student_1",
    content: "See you there",
  });
});

describe("student announcements route", () => {
  it("returns announcements with normalized reaction counts and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_announcements");
    expect(body.announcements).toEqual([
      expect.objectContaining({
        id: "announcement_1",
        ownReaction: "\u{1F64F}",
        reactionCounts: { "\u{1F64F}": 2 },
        replies: [
          expect.objectContaining({
            authorName: "Student One",
            mine: true,
          }),
        ],
      }),
    ]);
  });

  it("saves a coded reaction as a real emoji", async () => {
    const response = await PATCH(request("PATCH", { announcementId: "announcement_1", emoji: "LOVE" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.announcementReactionUpsert).toHaveBeenCalledWith({
      where: {
        announcementId_studentId: {
          announcementId: "announcement_1",
          studentId: "student_1",
        },
      },
      update: { emoji: "\u2764\uFE0F" },
      create: {
        announcementId: "announcement_1",
        studentId: "student_1",
        emoji: "\u2764\uFE0F",
      },
    });
  });

  it("toggles off an existing matching reaction", async () => {
    mocks.announcementReactionFindUnique.mockResolvedValue({
      id: "reaction_1",
      emoji: "\u{1F44D}",
    });

    const response = await PATCH(request("PATCH", { announcementId: "announcement_1", emoji: "LIKE" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true, reaction: null });
    expect(mocks.announcementReactionDelete).toHaveBeenCalledWith({ where: { id: "reaction_1" } });
    expect(mocks.announcementReactionUpsert).not.toHaveBeenCalled();
  });

  it("rejects unsupported reactions", async () => {
    const response = await PATCH(request("PATCH", { announcementId: "announcement_1", emoji: "WOW" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Unsupported reaction");
  });

  it("blocks hidden or unrelated announcements", async () => {
    mocks.announcementFindUnique.mockResolvedValue({
      id: "announcement_2",
      batchId: "other_batch",
      type: "BATCH",
      publishedAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    const response = await PATCH(request("PATCH", { announcementId: "announcement_2", emoji: "PRAY" }));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Announcement not found");
    expect(mocks.announcementReactionUpsert).not.toHaveBeenCalled();
  });

  it("creates a reply for a visible announcement", async () => {
    const response = await POST(request("POST", { announcementId: "announcement_1", content: "See you there" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.announcementReplyCreate).toHaveBeenCalledWith({
      data: {
        announcementId: "announcement_1",
        studentId: "student_1",
        content: "See you there",
      },
    });
  });

  it("validates reply content", async () => {
    const response = await POST(request("POST", { announcementId: "announcement_1", content: "" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });

  it("logs list failures without leaking internals", async () => {
    mocks.announcementFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to load announcements");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "app.announcements.list",
      expect.any(Error),
      expect.any(NextRequest),
      { studentId: "student_1" },
    );
  });
});
