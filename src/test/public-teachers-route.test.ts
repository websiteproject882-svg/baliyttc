import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/teachers/route";

const mocks = vi.hoisted(() => ({
  teacherFindMany: vi.fn(),
  staffFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    teacher: {
      findMany: mocks.teacherFindMany,
    },
    staff: {
      findMany: mocks.staffFindMany,
    },
  },
}));

vi.mock("@/data/site", () => ({
  TEACHERS: [
    {
      name: "Static Teacher",
      role: "Yoga Teacher",
      cred: "RYT 500",
      bio: "Static teacher bio",
      img: "/images/teachers/static.jpg",
      style: ["Hatha"],
    },
  ],
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request() {
  return new NextRequest("https://example.com/api/teachers", {
    headers: { "x-request-id": "req_public_teachers" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public teachers route", () => {
  it("combines dedicated teacher profiles with active admin teacher staff", async () => {
    mocks.teacherFindMany.mockResolvedValue([
      {
        id: "teacher_1",
        name: "Dedicated Teacher",
        slug: "dedicated-teacher",
        role: "Lead Teacher",
        credentials: "E-RYT 500",
        bio: "Dedicated teacher bio",
        image: "/images/teachers/dedicated.jpg",
          styles: ["Asana"],
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z"),
          internalNote: "do not expose",
        },
      ]);
    mocks.staffFindMany.mockResolvedValue([
      {
        id: "staff_1",
        user: {
          displayName: "Admin Teacher",
          email: "teacher@example.com",
        },
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_teachers");
    expect(mocks.staffFindMany).toHaveBeenCalledWith({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(mocks.teacherFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        credentials: true,
        bio: true,
        image: true,
        styles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    expect(body.teachers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "teacher_1",
          name: "Dedicated Teacher",
          slug: "dedicated-teacher",
        }),
        expect.objectContaining({
          id: "staff-staff_1",
          name: "Admin Teacher",
          slug: "admin-teacher",
          role: "Teacher",
          source: "staff",
        }),
      ]),
    );
    expect(body.teachers[0].internalNote).toBeUndefined();
  });

  it("does not duplicate staff teachers that already have a dedicated profile", async () => {
    mocks.teacherFindMany.mockResolvedValue([
      {
        id: "teacher_1",
        name: "Admin Teacher",
        slug: "admin-teacher",
        role: "Lead Teacher",
        credentials: "",
        bio: "",
        image: null,
        styles: [],
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
    mocks.staffFindMany.mockResolvedValue([
      {
        id: "staff_1",
        user: {
          displayName: "Admin Teacher",
          email: "teacher@example.com",
        },
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);

    const response = await GET(request());
    const body = await response.json();

    expect(body.teachers).toHaveLength(1);
    expect(body.teachers[0]).toEqual(expect.objectContaining({ id: "teacher_1", slug: "admin-teacher" }));
  });

  it("falls back to static teachers when the database fails", async () => {
    mocks.teacherFindMany.mockRejectedValue(new Error("database down"));
    mocks.staffFindMany.mockResolvedValue([]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.teachers).toEqual([
      expect.objectContaining({
        id: "static-teacher-1",
        name: "Static Teacher",
        slug: "static-teacher",
      }),
    ]);
    expect(mocks.logApiError).toHaveBeenCalledWith("teachers.public", expect.any(Error), expect.any(NextRequest));
  });
});
