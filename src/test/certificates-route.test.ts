import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/certificates/route";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  studentFindUnique: vi.fn(),
  studentFindFirst: vi.fn(),
  studentUpdate: vi.fn(),
  courseFindUnique: vi.fn(),
  certificateFindMany: vi.fn(),
  certificateFindFirst: vi.fn(),
  certificateCreate: vi.fn(),
  getCertificateEligibility: vi.fn(),
  generateCertificateId: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  getCurrentUser: mocks.getCurrentUser,
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    student: {
      findUnique: mocks.studentFindUnique,
      findFirst: mocks.studentFindFirst,
      update: mocks.studentUpdate,
    },
    course: {
      findUnique: mocks.courseFindUnique,
    },
    certificate: {
      findMany: mocks.certificateFindMany,
      findFirst: mocks.certificateFindFirst,
      create: mocks.certificateCreate,
    },
  },
}));

vi.mock("@/lib/certificate-eligibility", () => ({
  getCertificateEligibility: mocks.getCertificateEligibility,
}));

vi.mock("@/lib/certificate", () => ({
  generateCertificateId: mocks.generateCertificateId,
}));

vi.mock("@/lib/certificate-access", async () => {
  const actual = await vi.importActual<typeof import("../lib/certificate-access")>("../lib/certificate-access");
  return actual;
});

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
  role: "STUDENT_MANAGER",
};

const studentUser = {
  id: "user_1",
  email: "student@example.com",
  displayName: "Student",
  role: "STUDENT",
};

const student = {
  id: "student_1",
  userId: "user_1",
  user: {
    id: "user_1",
    email: "student@example.com",
  },
  certificates: [],
};

const eligibility = {
  eligible: true,
  reasons: [],
  completedHours: 200,
  totalHours: 200,
  modulesCompleted: 8,
  modulesRequired: 8,
  completionPercent: 100,
  accessLevel: "FULL",
};

function getRequest(query = "?studentId=student_1") {
  return new NextRequest(`https://example.com/api/certificates${query}`, {
    headers: { "x-request-id": "req_certificates" },
  });
}

function postRequest(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/certificates", {
    method: "POST",
    headers: { "x-request-id": "req_certificates" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue(studentUser);
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: adminUser, response: null });
  mocks.studentFindUnique.mockResolvedValue(student);
  mocks.studentFindFirst.mockResolvedValue(student);
  mocks.courseFindUnique.mockResolvedValue({ id: "course_1", slug: "200-hour-yttc", name: "200 Hour YTTC" });
  mocks.certificateFindMany.mockResolvedValue([{ id: "certificate_1", certificateId: "CERT-1" }]);
  mocks.certificateFindFirst.mockResolvedValue(null);
  mocks.certificateCreate.mockResolvedValue({
    id: "certificate_1",
    certificateId: "BALI-200-2026-TEST",
    course: "200 Hour YTTC",
    status: "ISSUED",
  });
  mocks.studentUpdate.mockResolvedValue({ id: "student_1" });
  mocks.getCertificateEligibility.mockResolvedValue(eligibility);
  mocks.generateCertificateId.mockReturnValue("BALI-200-2026-TEST");
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("certificates route", () => {
  it("requires authentication to list certificates", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await GET(getRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("X-Request-Id")).toBe("req_certificates");
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mocks.studentFindUnique).not.toHaveBeenCalled();
  });

  it("lets the owner list certificates and eligibility", async () => {
    const response = await GET(getRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.studentFindUnique).toHaveBeenCalledWith({
      where: { id: "student_1" },
      include: { user: true, certificates: true },
    });
    expect(mocks.certificateFindMany).toHaveBeenCalledWith({
      where: { studentId: "student_1" },
      orderBy: { issuedAt: "desc" },
    });
    expect(body).toEqual({
      certificates: [{ id: "certificate_1", certificateId: "CERT-1" }],
      eligibility,
    });
  });

  it("blocks non-owner students from listing another student's certificates", async () => {
    mocks.getCurrentUser.mockResolvedValue({ ...studentUser, id: "other_user" });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.certificateFindMany).not.toHaveBeenCalled();
  });

  it("allows privileged admins to list by email", async () => {
    mocks.getCurrentUser.mockResolvedValue(adminUser);

    const response = await GET(getRequest("?email=student@example.com"));

    expect(response.status).toBe(200);
    expect(mocks.studentFindFirst).toHaveBeenCalledWith({
      where: { user: { email: "student@example.com" } },
      include: { user: true, certificates: true },
    });
  });

  it("respects stored staff permissions when listing another student's certificates", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      ...adminUser,
      staffId: "staff_1",
      permissions: ["students.view"],
    });

    const response = await GET(getRequest("?email=student@example.com"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.certificateFindMany).not.toHaveBeenCalled();
  });

  it("requires certificate issue permission before creating a certificate", async () => {
    const forbidden = Response.json({ error: "Forbidden" }, { status: 403 });
    mocks.requirePermission.mockResolvedValue({ user: null, response: forbidden });

    const response = await POST(postRequest({ studentId: "student_1", courseSlug: "200-hour-yttc" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.studentFindUnique).not.toHaveBeenCalled();
  });

  it("validates required create fields", async () => {
    const response = await POST(postRequest({ studentId: "student_1" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_certificates");
    expect(body).toEqual({ error: "studentId and courseSlug are required" });
  });

  it("returns an existing certificate without duplicating issuance", async () => {
    mocks.certificateFindFirst.mockResolvedValue({
      id: "existing_certificate",
      certificateId: "CERT-EXISTING",
    });

    const response = await POST(postRequest({ studentId: "student_1", courseSlug: "200-hour-yttc" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      certificate: { id: "existing_certificate", certificateId: "CERT-EXISTING" },
      message: "Certificate already exists",
    });
    expect(mocks.certificateCreate).not.toHaveBeenCalled();
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
  });

  it("blocks certificate issuance when eligibility fails", async () => {
    mocks.getCertificateEligibility.mockResolvedValue({
      ...eligibility,
      eligible: false,
      reasons: ["Complete all modules."],
    });

    const response = await POST(postRequest({ studentId: "student_1", courseSlug: "200-hour-yttc" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Student is not eligible for certificate issuance");
    expect(body.eligibility.reasons).toEqual(["Complete all modules."]);
    expect(mocks.certificateCreate).not.toHaveBeenCalled();
  });

  it("creates an eligible certificate, marks the student, and audits issuance", async () => {
    const response = await POST(postRequest({ studentId: "student_1", courseSlug: "200-hour-yttc" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      certificate: {
        id: "certificate_1",
        certificateId: "BALI-200-2026-TEST",
        course: "200 Hour YTTC",
        status: "ISSUED",
      },
      eligibility,
    });
    expect(mocks.generateCertificateId).toHaveBeenCalledWith("200-hour-yttc", 2026);
    expect(mocks.certificateCreate).toHaveBeenCalledWith({
      data: {
        studentId: "student_1",
        certificateId: "BALI-200-2026-TEST",
        course: "200 Hour YTTC",
        status: "ISSUED",
        issuedAt: expect.any(Date),
      },
    });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        certificateIssued: true,
        certificateId: "certificate_1",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "certificate.issued",
        entity: "certificate",
        entityId: "certificate_1",
      }),
    );
  });
});
