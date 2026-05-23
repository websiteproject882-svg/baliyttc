import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "../app/api/admin/students/access/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  enrollmentUpdate: vi.fn(),
  batchFindUnique: vi.fn(),
  studentUpdate: vi.fn(),
  studentCreate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    enrollment: {
      findUnique: mocks.enrollmentFindUnique,
      update: mocks.enrollmentUpdate,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
    },
    student: {
      update: mocks.studentUpdate,
      create: mocks.studentCreate,
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

const adminUser = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin",
  role: "SUPER_ADMIN",
  permissions: [],
  authType: "admin",
};

const enrollment = {
  id: "enrollment_1",
  userId: "user_1",
  studentId: "student_1",
  phone: "+911234567890",
  batchId: "batch_1",
  courseSlug: "200hr",
  accessLevel: "NONE",
  paymentStatus: "PENDING",
  student: {
    id: "student_1",
    accessLevel: "NONE",
    paymentStatus: "PENDING",
  },
  user: {
    id: "user_1",
    email: "student@example.com",
  },
};

function request(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/students/access", {
    method: "PATCH",
    headers: { "x-request-id": "req_student_access" },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest("https://example.com/api/admin/students/access", {
    method: "PATCH",
    headers: { "x-request-id": "req_student_access" },
    body,
  });
}

async function patch(body: Record<string, unknown>) {
  return PATCH(request(body));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: adminUser, response: null });
  mocks.enrollmentFindUnique.mockResolvedValue(enrollment);
  mocks.batchFindUnique.mockResolvedValue({
    id: "batch_1",
    course: {
      name: "200-Hour Hatha Ashtanga Vinyasa YTT",
      modules: [{ hours: 80 }, { hours: 120 }],
    },
  });
  mocks.studentUpdate.mockResolvedValue({
    id: "student_1",
    accessLevel: "PRE_ARRIVAL",
    paymentStatus: "DEPOSIT_PAID",
  });
  mocks.studentCreate.mockResolvedValue({
    id: "student_created",
    accessLevel: "PRE_ARRIVAL",
    paymentStatus: "DEPOSIT_PAID",
  });
  mocks.enrollmentUpdate.mockResolvedValue({
    id: "enrollment_1",
    studentId: "student_1",
    accessLevel: "PRE_ARRIVAL",
    paymentStatus: "DEPOSIT_PAID",
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin student access route", () => {
  it("requires an admin session before changing access", async () => {
    const unauthorized = Response.json({ error: "Unauthorized" }, { status: 401 });
    mocks.requirePermission.mockResolvedValue({ user: null, response: unauthorized });

    const response = await patch({ enrollmentId: "enrollment_1", accessLevel: "PRE_ARRIVAL" });
    const body = await response?.json();

    expect(response?.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
  });

  it("validates required enrollment and access level fields", async () => {
    const response = await patch({ enrollmentId: "", accessLevel: "INVALID" });
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_access");
    expect(body.error).toBe("Validation failed");
    expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
  });

  it("rejects malformed access update JSON before enrollment lookup", async () => {
    const response = await PATCH(rawRequest("{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_access");
    expect(body.error).toBe("Validation failed");
    expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
    expect(mocks.studentCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("returns 404 when the enrollment is missing", async () => {
    mocks.enrollmentFindUnique.mockResolvedValue(null);

    const response = await patch({ enrollmentId: "missing", accessLevel: "FULL" });
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body).toEqual({ error: "Enrollment not found" });
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
    expect(mocks.studentCreate).not.toHaveBeenCalled();
  });

  it("updates an existing student and enrollment to pre-arrival access", async () => {
    const response = await patch({ enrollmentId: "enrollment_1", accessLevel: "PRE_ARRIVAL" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("students.approve");
    expect(body.success).toBe(true);
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        accessLevel: "PRE_ARRIVAL",
        paymentStatus: "DEPOSIT_PAID",
        batchId: "batch_1",
        enrolledCourse: "200-Hour Hatha Ashtanga Vinyasa YTT",
        totalHours: 200,
        phone: "+911234567890",
      },
    });
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        studentId: "student_1",
        accessLevel: "PRE_ARRIVAL",
        paymentStatus: "DEPOSIT_PAID",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "student.access_updated",
        entity: "enrollment",
        entityId: "enrollment_1",
      }),
    );
  });

  it("creates a student record when the enrollment has no student yet", async () => {
    mocks.enrollmentFindUnique.mockResolvedValue({
      ...enrollment,
      studentId: null,
      student: null,
    });
    mocks.enrollmentUpdate.mockResolvedValue({
      id: "enrollment_1",
      studentId: "student_created",
      accessLevel: "FULL",
      paymentStatus: "FULL_PAID",
    });
    mocks.studentCreate.mockResolvedValue({
      id: "student_created",
      accessLevel: "FULL",
      paymentStatus: "FULL_PAID",
    });

    const response = await patch({ enrollmentId: "enrollment_1", accessLevel: "FULL" });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.student.id).toBe("student_created");
    expect(mocks.studentCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        accessLevel: "FULL",
        paymentStatus: "FULL_PAID",
        batchId: "batch_1",
        enrolledCourse: "200-Hour Hatha Ashtanga Vinyasa YTT",
        totalHours: 200,
        phone: "+911234567890",
      },
    });
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        studentId: "student_created",
        accessLevel: "FULL",
        paymentStatus: "FULL_PAID",
      },
    });
  });

  it("maps alumni access to full paid payment status", async () => {
    mocks.studentUpdate.mockResolvedValue({
      id: "student_1",
      accessLevel: "ALUMNI",
      paymentStatus: "FULL_PAID",
    });
    mocks.enrollmentUpdate.mockResolvedValue({
      id: "enrollment_1",
      studentId: "student_1",
      accessLevel: "ALUMNI",
      paymentStatus: "FULL_PAID",
    });

    const response = await patch({ enrollmentId: "enrollment_1", accessLevel: "ALUMNI" });

    expect(response?.status).toBe(200);
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        accessLevel: "ALUMNI",
        paymentStatus: "FULL_PAID",
        batchId: "batch_1",
        enrolledCourse: "200-Hour Hatha Ashtanga Vinyasa YTT",
        totalHours: 200,
        phone: "+911234567890",
      },
    });
    expect(mocks.enrollmentUpdate).toHaveBeenCalledWith({
      where: { id: "enrollment_1" },
      data: {
        studentId: "student_1",
        accessLevel: "ALUMNI",
        paymentStatus: "FULL_PAID",
      },
    });
  });
});
