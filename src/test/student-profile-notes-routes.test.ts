import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getProfile, PATCH as patchProfile } from "../app/api/app/profile/route";
import { GET as getNotes, PATCH as patchNotes } from "../app/api/app/notes/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  writeAuditLog: vi.fn(),
  studentFindUnique: vi.fn(),
  studentUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
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
      update: mocks.studentUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
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

function request(url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method: body ? "PATCH" : "GET",
    headers: { "x-request-id": "req_student_profile" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function profileRequest(body?: Record<string, unknown>) {
  return request("https://example.com/api/app/profile", body);
}

function notesRequest(body?: Record<string, unknown>) {
  return request("https://example.com/api/app/notes", body);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.studentFindUnique.mockResolvedValue({
    phone: "+911234567890",
    nationality: "India",
    dietaryRequirements: "Vegetarian",
    yogaExperience: "2 years",
    emergencyContact: "Parent +91",
    enrolledCourse: "200 Hour YTTC",
    enrollmentDate: new Date("2026-01-01T00:00:00.000Z"),
    paymentStatus: "DEPOSIT_PAID",
    accessLevel: "PRE_ARRIVAL",
    personalNotes: "Bring mat",
    batch: {
      name: "March 2026",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-21T00:00:00.000Z"),
      course: { name: "200 Hour YTTC" },
    },
  });
  mocks.userFindUnique.mockResolvedValue({
    displayName: "Student One",
    photoURL: "https://example.com/photo.jpg",
  });
  mocks.userUpdate.mockResolvedValue({ id: "user_1" });
  mocks.studentUpdate.mockResolvedValue({
    phone: "+911111111111",
    nationality: "India",
    dietaryRequirements: "Vegan",
    yogaExperience: "3 years",
    emergencyContact: "Sibling +91",
    personalNotes: "Updated notes",
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("student profile and notes routes", () => {
  it("returns profile data with request id", async () => {
    const response = await getProfile(profileRequest());
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_profile");
    expect(body).toEqual(
      expect.objectContaining({
        email: "student@example.com",
        displayName: "Student One",
        photoURL: "https://example.com/photo.jpg",
        phone: "+911234567890",
        enrolledCourse: "200 Hour YTTC",
        batchName: "March 2026",
        accessLevel: "PRE_ARRIVAL",
      }),
    );
  });

  it("validates profile photo URL before saving", async () => {
    const response = await patchProfile(profileRequest({ photoURL: "ftp://example.com/photo.jpg" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_profile");
    expect(body.error).toBe("Validation failed");
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.studentUpdate).not.toHaveBeenCalled();
  });

  it("updates user and student profile fields and writes an audit log", async () => {
    const response = await patchProfile(
      profileRequest({
        displayName: "Updated Student",
        photoURL: "data:image/png;base64,abc",
        phone: "+911111111111",
        nationality: "India",
        dietaryRequirements: "Vegan",
        yogaExperience: "3 years",
        emergencyContact: "Sibling +91",
      }),
    );
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({
      success: true,
      profile: expect.objectContaining({
        phone: "+911111111111",
        dietaryRequirements: "Vegan",
      }),
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        displayName: "Updated Student",
        photoURL: "data:image/png;base64,abc",
      },
    });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        phone: "+911111111111",
        nationality: "India",
        dietaryRequirements: "Vegan",
        yogaExperience: "3 years",
        emergencyContact: "Sibling +91",
      },
      select: {
        phone: true,
        nationality: true,
        dietaryRequirements: true,
        yogaExperience: true,
        emergencyContact: true,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_1",
        action: "student.profile_updated",
        entity: "student",
        entityId: "student_1",
      }),
    );
  });

  it("returns and updates personal notes with audit logging", async () => {
    const getResponse = await getNotes(notesRequest());
    const getBody = await getResponse?.json();

    expect(getResponse?.status).toBe(200);
    expect(getBody).toEqual({ personalNotes: "Bring mat" });

    const patchResponse = await patchNotes(notesRequest({ personalNotes: "Updated notes" }));
    const patchBody = await patchResponse?.json();

    expect(patchResponse?.status).toBe(200);
    expect(patchBody).toEqual({ success: true, personalNotes: "Updated notes" });
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: { personalNotes: "Updated notes" },
      select: { personalNotes: true },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_1",
        action: "student.notes_updated",
        entityId: "student_1",
      }),
    );
  });

  it("validates personal notes length", async () => {
    const response = await patchNotes(notesRequest({ personalNotes: "x".repeat(10001) }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });
});
