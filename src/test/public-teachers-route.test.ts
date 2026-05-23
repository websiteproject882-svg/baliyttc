import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/teachers/route";

const mocks = vi.hoisted(() => ({
  teacherFindMany: vi.fn(),
  staffFindMany: vi.fn(),
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

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.staffFindMany).toHaveBeenCalledWith({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
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

    const response = await GET();
    const body = await response.json();

    expect(body.teachers).toHaveLength(1);
    expect(body.teachers[0]).toEqual(expect.objectContaining({ id: "teacher_1", slug: "admin-teacher" }));
  });
});
