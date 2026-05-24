import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as patchModuleProgress } from "../app/api/app/modules/[moduleId]/route";
import { PATCH as patchTaskProgress } from "../app/api/app/tasks/[taskKey]/route";

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(),
  requireStudentUser: vi.fn(),
  writeAuditLog: vi.fn(),
  studentFindUnique: vi.fn(),
  batchFindUnique: vi.fn(),
  moduleFindFirst: vi.fn(),
  moduleFindMany: vi.fn(),
  moduleProgressFindUnique: vi.fn(),
  moduleProgressUpsert: vi.fn(),
  moduleProgressFindMany: vi.fn(),
  studentUpdate: vi.fn(),
  taskProgressFindUnique: vi.fn(),
  taskProgressUpdate: vi.fn(),
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
    batch: {
      findUnique: mocks.batchFindUnique,
    },
    module: {
      findFirst: mocks.moduleFindFirst,
      findMany: mocks.moduleFindMany,
    },
    moduleProgress: {
      findUnique: mocks.moduleProgressFindUnique,
      upsert: mocks.moduleProgressUpsert,
      findMany: mocks.moduleProgressFindMany,
    },
    taskProgress: {
      findUnique: mocks.taskProgressFindUnique,
      update: mocks.taskProgressUpdate,
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
  displayName: "Student",
  role: "STUDENT",
  permissions: [],
  authType: "student",
};

const student = {
  id: "student_1",
  userId: "user_1",
  accessLevel: "FULL",
  paymentStatus: "FULL_PAID",
  batchId: "batch_1",
  enrolledCourse: "200 Hour YTTC",
};

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "x-request-id": "req_student_progress" },
    body: JSON.stringify(body),
  });
}

function moduleRequest(body: Record<string, unknown>) {
  return request("https://example.com/api/app/modules/module_1", body);
}

function taskRequest(body: Record<string, unknown>) {
  return request("https://example.com/api/app/tasks/read_manual", body);
}

function rawRequest(url: string, body: string) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "x-request-id": "req_student_progress" },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.studentFindUnique.mockResolvedValue({
    batchId: "batch_1",
    enrollments: [],
  });
  mocks.batchFindUnique.mockResolvedValue({ courseId: "course_1" });
  mocks.moduleFindFirst.mockResolvedValue({ id: "module_1", title: "Anatomy" });
  mocks.moduleFindMany.mockResolvedValue([
    { id: "module_1", hours: 10 },
    { id: "module_2", hours: 5 },
  ]);
  mocks.moduleProgressFindUnique.mockResolvedValue({
    id: "progress_1",
    completed: false,
    completedAt: null,
    notes: null,
  });
  mocks.moduleProgressUpsert.mockResolvedValue({
    id: "progress_1",
    moduleId: "module_1",
    moduleTitle: "Anatomy",
    completed: true,
    completedAt: new Date("2026-05-23T00:00:00.000Z"),
    notes: "Done",
  });
  mocks.moduleProgressFindMany.mockResolvedValue([{ moduleId: "module_1" }]);
  mocks.studentUpdate.mockResolvedValue({ id: "student_1", completedHours: 10 });
  mocks.taskProgressFindUnique.mockResolvedValue({
    id: "task_1",
    taskKey: "read_manual",
    completed: false,
  });
  mocks.taskProgressUpdate.mockResolvedValue({
    id: "task_1",
    taskKey: "read_manual",
    completed: true,
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("student progress routes", () => {
  it("requires full student access for module progress updates", async () => {
    const forbidden = Response.json({ error: "Student access is not active" }, { status: 403 });
    mocks.requireStudentUser.mockResolvedValue({ user: null, student: null, response: forbidden });

    const response = await patchModuleProgress(moduleRequest({ completed: true }), { params: { moduleId: "module_1" } });
    const body = await response?.json();

    expect(response?.status).toBe(403);
    expect(body).toEqual({ error: "Student access is not active" });
    expect(mocks.studentFindUnique).not.toHaveBeenCalled();
  });

  it("updates module progress, recalculates completed hours, and audits the change", async () => {
    const response = await patchModuleProgress(moduleRequest({ completed: true, notes: "  Done  " }), {
      params: { moduleId: "module_1" },
    });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_progress");
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        completedHours: 10,
      }),
    );
    expect(mocks.moduleProgressUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId_moduleId: {
            studentId: "student_1",
            moduleId: "module_1",
          },
        },
        update: expect.objectContaining({
          moduleTitle: "Anatomy",
          completed: true,
          notes: "Done",
        }),
      }),
    );
    expect(mocks.studentUpdate).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: {
        completedHours: 10,
        modulesCompleted: ["module_1"],
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_1",
        action: "student.module_progress_updated",
        entity: "module_progress",
        entityId: "progress_1",
      }),
    );
  });

  it("returns 400 when the student has no active batch for module progress", async () => {
    mocks.studentFindUnique.mockResolvedValue({ batchId: null, enrollments: [] });

    const response = await patchModuleProgress(moduleRequest({ completed: true }), { params: { moduleId: "module_1" } });
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body).toEqual({ error: "Student batch is not assigned" });
    expect(mocks.moduleProgressUpsert).not.toHaveBeenCalled();
  });

  it("rejects malformed module progress JSON before reading progress data", async () => {
    const response = await patchModuleProgress(
      rawRequest("https://example.com/api/app/modules/module_1", "{not-valid-json"),
      { params: { moduleId: "module_1" } },
    );
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_progress");
    expect(body.error).toBe("Validation failed");
    expect(mocks.studentFindUnique).not.toHaveBeenCalled();
    expect(mocks.moduleProgressUpsert).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects invalid module ids before reading progress data", async () => {
    const response = await patchModuleProgress(moduleRequest({ completed: true }), {
      params: { moduleId: "x".repeat(121) },
    });
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body).toEqual({ error: "Invalid module id" });
    expect(mocks.studentFindUnique).not.toHaveBeenCalled();
    expect(mocks.moduleProgressUpsert).not.toHaveBeenCalled();
  });

  it("requires pre-arrival access for task updates and returns 404 for missing tasks", async () => {
    mocks.taskProgressFindUnique.mockResolvedValue(null);

    const response = await patchTaskProgress(taskRequest({ completed: true }), { params: { taskKey: "read_manual" } });
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_progress");
    expect(body).toEqual({ error: "Task not found" });
    expect(mocks.taskProgressUpdate).not.toHaveBeenCalled();
    expect(mocks.requireStudentUser).toHaveBeenCalledWith({ minimumAccess: "PRE_ARRIVAL" });
  });

  it("rejects malformed task progress JSON before reading task data", async () => {
    const response = await patchTaskProgress(
      rawRequest("https://example.com/api/app/tasks/read_manual", "{not-valid-json"),
      { params: { taskKey: "read_manual" } },
    );
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_progress");
    expect(body.error).toBe("Validation failed");
    expect(mocks.taskProgressFindUnique).not.toHaveBeenCalled();
    expect(mocks.taskProgressUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects invalid task keys before reading task data", async () => {
    const response = await patchTaskProgress(taskRequest({ completed: true }), {
      params: { taskKey: "x".repeat(121) },
    });
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body).toEqual({ error: "Invalid task key" });
    expect(mocks.taskProgressFindUnique).not.toHaveBeenCalled();
    expect(mocks.taskProgressUpdate).not.toHaveBeenCalled();
  });

  it("updates task completion and writes an audit log", async () => {
    const response = await patchTaskProgress(taskRequest({ completed: true }), { params: { taskKey: "read_manual" } });
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({
      success: true,
      task: {
        id: "task_1",
        taskKey: "read_manual",
        completed: true,
      },
    });
    expect(mocks.taskProgressUpdate).toHaveBeenCalledWith({
      where: {
        studentId_taskKey: {
          studentId: "student_1",
          taskKey: "read_manual",
        },
      },
      data: {
        completed: true,
        completedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_1",
        action: "student.task_updated",
        entity: "task_progress",
        entityId: "task_1",
      }),
    );
  });
});
