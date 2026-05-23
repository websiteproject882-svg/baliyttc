import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/courses/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  courseFindMany: vi.fn(),
  courseFindUnique: vi.fn(),
  courseCreate: vi.fn(),
  courseUpdate: vi.fn(),
  courseDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findMany: mocks.courseFindMany,
      findUnique: mocks.courseFindUnique,
      create: mocks.courseCreate,
      update: mocks.courseUpdate,
      delete: mocks.courseDelete,
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
  permissions: ["courses.view", "courses.create", "courses.edit"],
  authType: "admin",
};

const course = {
  id: "course_1",
  name: "200 Hour YTT",
  slug: "200-hour-ytt",
  duration: "21 days",
  summary: "Yoga teacher training in Bali",
  description: "A complete Yoga Alliance certified teacher training in Bali.",
  priceFrom: 1499,
  priceFull: 1899,
  image: "https://example.com/course.jpg",
  translations: { es: { name: "Formacion 200 horas" } },
  isActive: true,
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/courses") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_courses",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: "200 Hour YTT",
    slug: "200 Hour YTT",
    duration: "21 days",
    summary: "Yoga teacher training in Bali",
    description: "A complete Yoga Alliance certified teacher training in Bali.",
    priceFrom: 1499,
    priceFull: 1899,
    image: "https://example.com/course.jpg",
    translations: { es: { name: "Formacion 200 horas" } },
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.courseFindMany.mockResolvedValue([course]);
  mocks.courseFindUnique.mockResolvedValue(course);
  mocks.courseCreate.mockResolvedValue(course);
  mocks.courseUpdate.mockResolvedValue({ ...course, name: "Updated YTT" });
  mocks.courseDelete.mockResolvedValue(course);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin courses route", () => {
  it("lists courses with modules, batches, counts, and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_courses");
    expect(body.courses).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("courses.view");
    expect(mocks.courseFindMany).toHaveBeenCalledWith({
      include: {
        modules: { orderBy: { order: "asc" } },
        batches: {
          include: {
            _count: { select: { students: true } },
          },
          orderBy: { startDate: "asc" },
        },
        _count: {
          select: {
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  });

  it("creates courses, normalizes slugs, and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("courses.create");
    expect(mocks.courseCreate).toHaveBeenCalledWith({
      data: {
        name: "200 Hour YTT",
        slug: "200-hour-ytt",
        duration: "21 days",
        summary: "Yoga teacher training in Bali",
        description: "A complete Yoga Alliance certified teacher training in Bali.",
        priceFrom: 1499,
        priceFull: 1899,
        image: "https://example.com/course.jpg",
        translations: { es: { name: "Formacion 200 horas" } },
        isActive: true,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "course.created",
        entity: "course",
        entityId: "course_1",
      }),
    );
  });

  it("stores optional image and full price as nulls", async () => {
    await POST(request("POST", payload({ image: "", priceFull: undefined, translations: undefined, isActive: undefined })));

    expect(mocks.courseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priceFull: null,
        image: null,
        translations: undefined,
        isActive: true,
      }),
    });
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ slug: "bad slug !", description: "short" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.courseCreate).not.toHaveBeenCalled();
  });

  it("updates existing courses and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "course_1", name: "Updated YTT" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.course.name).toBe("Updated YTT");
    expect(mocks.requirePermission).toHaveBeenCalledWith("courses.edit");
    expect(mocks.courseUpdate).toHaveBeenCalledWith({
      where: { id: "course_1" },
      data: expect.objectContaining({
        name: "Updated YTT",
        slug: "200-hour-ytt",
        priceFull: 1899,
        image: "https://example.com/course.jpg",
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "course.updated",
        oldValue: course,
      }),
    );
  });

  it("returns 404 when updating a missing course", async () => {
    mocks.courseFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Course not found");
    expect(mocks.courseUpdate).not.toHaveBeenCalled();
  });

  it("deletes courses and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/courses?id=course_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.courseDelete).toHaveBeenCalledWith({ where: { id: "course_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "course.deleted",
        entityId: "course_1",
        oldValue: course,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Course id is required");
  });

  it("returns 404 when deleting a missing course", async () => {
    mocks.courseFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/courses?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Course not found");
    expect(mocks.courseDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.courseDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/courses?id=course_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete course");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.courses.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
