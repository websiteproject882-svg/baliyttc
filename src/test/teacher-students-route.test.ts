import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/teacher/students/route";

const mocks = vi.hoisted(() => ({
  currentUserHasPermission: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  studentFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  currentUserHasPermission: mocks.currentUserHasPermission,
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    student: {
      findMany: mocks.studentFindMany,
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

function request(url = "https://example.com/api/teacher/students?batchId=batch_1") {
  return new NextRequest(url, {
    headers: { "x-request-id": "req_teacher_students" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ user: teacher, response: null });
  mocks.currentUserHasPermission.mockReturnValue(false);
  mocks.studentFindMany.mockResolvedValue([
    {
      id: "student_1",
      user: { displayName: "Asha", email: "asha@example.com" },
      phone: "+62 123",
      batch: { name: "March 2026", course: { name: "200-Hour YTT" } },
      completedHours: 250,
      totalHours: 200,
      certificateIssued: true,
      enrollmentDate: new Date("2026-03-01T00:00:00.000Z"),
    },
    {
      id: "student_2",
      user: { displayName: null, email: "fallback@example.com" },
      phone: null,
      batch: null,
      completedHours: 5,
      totalHours: 0,
      certificateIssued: false,
      enrollmentDate: null,
    },
  ]);
});

describe("teacher students route", () => {
  it("lists active students with request id and safe progress values", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_teacher_students");
    expect(mocks.studentFindMany).toHaveBeenCalledWith({
      where: {
        accessLevel: { in: ["PRE_ARRIVAL", "FULL"] },
        batchId: "batch_1",
      },
      include: {
        user: {
          select: { displayName: true, email: true },
        },
        batch: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(body.students).toEqual([
      expect.objectContaining({
        id: "student_1",
        name: "Asha",
        progress: 100,
      }),
      expect.objectContaining({
        id: "student_2",
        name: "fallback@example.com",
        progress: 0,
      }),
    ]);
  });

  it("allows privileged non-teacher staff to view students", async () => {
    mocks.requireAuthenticatedUser.mockResolvedValue({
      user: { ...teacher, role: "COURSE_MANAGER" },
      response: null,
    });
    mocks.currentUserHasPermission.mockReturnValue(true);

    const response = await GET(request("https://example.com/api/teacher/students"));

    expect(response.status).toBe(200);
    expect(mocks.currentUserHasPermission).toHaveBeenCalledWith(expect.objectContaining({ role: "COURSE_MANAGER" }), "students.view");
  });

  it("rejects unauthorized staff before reading students", async () => {
    mocks.requireAuthenticatedUser.mockResolvedValue({
      user: { ...teacher, role: "SEO_EDITOR" },
      response: null,
    });
    mocks.currentUserHasPermission.mockReturnValue(false);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.studentFindMany).not.toHaveBeenCalled();
  });

  it("rejects oversized batch ids before querying", async () => {
    const response = await GET(request(`https://example.com/api/teacher/students?batchId=${"x".repeat(121)}`));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid batchId" });
    expect(mocks.studentFindMany).not.toHaveBeenCalled();
  });

  it("logs database failures without exposing internals", async () => {
    mocks.studentFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch students" });
    expect(mocks.logApiError).toHaveBeenCalledWith("teacher.students.list", expect.any(Error), expect.any(NextRequest));
  });
});
