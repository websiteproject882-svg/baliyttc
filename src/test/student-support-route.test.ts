import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/app/support/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  writeAuditLog: vi.fn(),
  studentFindUnique: vi.fn(),
  leadCreate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireStudentUser: mocks.requireStudentUser,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    student: {
      findUnique: mocks.studentFindUnique,
    },
    lead: {
      create: mocks.leadCreate,
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

function supportRequest(body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/app/support", {
    method: "POST",
    headers: { "x-request-id": "req_student_support" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.studentFindUnique.mockResolvedValue({
    phone: "+6281999333327",
    enrolledCourse: "200 Hour YTTC",
    accessLevel: "PRE_ARRIVAL",
    paymentStatus: "DEPOSIT_PAID",
    batch: {
      name: "June 2026",
      course: { name: "200 Hour Yoga Teacher Training" },
    },
  });
  mocks.leadCreate.mockResolvedValue({
    id: "lead_1",
    source: "student_portal_support",
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("student support route", () => {
  it("creates an admin lead from a student support request", async () => {
    const response = await POST(
      supportRequest({
        subject: "Arrival question",
        message: "Can I confirm my airport pickup timing for the June batch?",
      }),
    );
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_support");
    expect(body).toEqual({ success: true, ticketId: "lead_1" });
    expect(mocks.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Student One",
        email: "student@example.com",
        phone: "+6281999333327",
        source: "student_portal_support",
        course: "200 Hour Yoga Teacher Training - June 2026",
        status: "NEW",
        message: expect.stringContaining("Subject: Arrival question"),
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "student.support_ticket_created",
      entity: "lead",
      entityId: "lead_1",
    }));
  });

  it("validates short support requests", async () => {
    const response = await POST(supportRequest({ subject: "Hi", message: "short" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("honors same-origin protection", async () => {
    const blocked = Response.json({ error: "CSRF" }, { status: 403 });
    mocks.requireSameOrigin.mockReturnValue(blocked);

    const response = await POST(
      supportRequest({
        subject: "Arrival question",
        message: "Can I confirm my airport pickup timing for the June batch?",
      }),
    );

    expect(response?.status).toBe(403);
    expect(mocks.requireStudentUser).not.toHaveBeenCalled();
  });
});
