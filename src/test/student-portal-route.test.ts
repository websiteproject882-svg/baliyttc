import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/app/portal/route";

const mocks = vi.hoisted(() => ({
  requireStudentUser: vi.fn(),
  studentFindUnique: vi.fn(),
  batchFindUnique: vi.fn(),
  batchFindMany: vi.fn(),
  taskProgressCreateMany: vi.fn(),
  taskProgressFindMany: vi.fn(),
  moduleFindMany: vi.fn(),
  moduleProgressCreateMany: vi.fn(),
  moduleProgressFindMany: vi.fn(),
  scheduleEntryFindMany: vi.fn(),
  announcementFindMany: vi.fn(),
  preArrivalResourceFindMany: vi.fn(),
  notificationFindMany: vi.fn(),
  getCertificateEligibility: vi.fn(),
  getSiteSettings: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireStudentUser: mocks.requireStudentUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    student: {
      findUnique: mocks.studentFindUnique,
    },
    batch: {
      findUnique: mocks.batchFindUnique,
      findMany: mocks.batchFindMany,
    },
    taskProgress: {
      createMany: mocks.taskProgressCreateMany,
      findMany: mocks.taskProgressFindMany,
    },
    module: {
      findMany: mocks.moduleFindMany,
    },
    moduleProgress: {
      createMany: mocks.moduleProgressCreateMany,
      findMany: mocks.moduleProgressFindMany,
    },
    scheduleEntry: {
      findMany: mocks.scheduleEntryFindMany,
    },
    announcement: {
      findMany: mocks.announcementFindMany,
    },
    preArrivalResource: {
      findMany: mocks.preArrivalResourceFindMany,
    },
    notification: {
      findMany: mocks.notificationFindMany,
    },
  },
}));

vi.mock("@/lib/certificate-eligibility", () => ({
  getCertificateEligibility: mocks.getCertificateEligibility,
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
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

const fullStudent = {
  id: "student_1",
  user: {
    email: "student@example.com",
    displayName: "Student One",
  },
  batchId: "batch_1",
  batch: {
    id: "batch_1",
    name: "March 2026",
    courseId: "course_1",
    course: { id: "course_1", name: "200 Hour YTTC" },
  },
  accessLevel: "FULL",
  paymentStatus: "FULL_PAID",
  enrolledCourse: "200 Hour YTTC",
  completedHours: 0,
  totalHours: 200,
  phone: "+911234567890",
  nationality: "India",
  dietaryRequirements: null,
  yogaExperience: null,
  emergencyContact: null,
  personalNotes: null,
  progress: [],
  certificates: [],
  taskProgress: [],
  enrollments: [
    {
      id: "enrollment_paid",
      courseSlug: "200-hour-yttc",
      batchId: "batch_1",
      accommodation: "SHARED",
      paymentType: "FULL",
      paymentStatus: "FULL_PAID",
      accessLevel: "FULL",
      amount: 1499,
      currency: "EUR",
      discount: 0,
      couponCode: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      payments: [
        {
          id: "payment_1",
          amount: 1499,
          currency: "EUR",
          method: "RAZORPAY",
          status: "FULL_PAID",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      ],
    },
    {
      id: "enrollment_pending",
      courseSlug: "300-hour-yttc",
      batchId: null,
      accommodation: "PRIVATE",
      paymentType: "DEPOSIT",
      paymentStatus: "PENDING",
      accessLevel: "NONE",
      amount: 699,
      currency: "EUR",
      discount: 0,
      couponCode: null,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      payments: [],
    },
  ],
};

function request() {
  return new NextRequest("https://example.com/api/app/portal", {
    headers: { "x-request-id": "req_student_portal" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStudentUser.mockResolvedValue({ user, student, response: null });
  mocks.studentFindUnique.mockResolvedValue(fullStudent);
  mocks.taskProgressCreateMany.mockResolvedValue({ count: 7 });
  mocks.taskProgressFindMany.mockResolvedValue([
    { id: "task_1", taskKey: "read_manual", taskTitle: "Read manual", completed: false },
  ]);
  mocks.moduleFindMany
    .mockResolvedValueOnce([
      { id: "module_1", title: "Anatomy", hours: 10 },
      { id: "module_2", title: "Practicum", hours: 20 },
    ])
    .mockResolvedValueOnce([
      { id: "module_1", title: "Anatomy", hours: 10 },
      { id: "module_2", title: "Practicum", hours: 20 },
    ]);
  mocks.moduleProgressCreateMany.mockResolvedValue({ count: 2 });
  mocks.moduleProgressFindMany.mockResolvedValue([
    {
      id: "progress_1",
      moduleId: "module_1",
      moduleTitle: "Anatomy",
      completed: true,
      completedAt: new Date("2026-02-01T00:00:00.000Z"),
      notes: "Done",
    },
  ]);
  mocks.scheduleEntryFindMany.mockResolvedValue([
    { id: "schedule_1", activities: ["Practice"], teacher: { name: "Teacher", role: "Lead", styles: ["Hatha"] } },
  ]);
  mocks.announcementFindMany.mockResolvedValue([{ id: "announcement_1", title: "Welcome" }]);
  mocks.preArrivalResourceFindMany.mockResolvedValue([{ id: "resource_1", title: "Visa Guide", taskKey: null }]);
  mocks.notificationFindMany.mockResolvedValue([
    {
      id: "notification_1",
      title: "Arrival",
      message: "Read this",
      type: "GENERAL",
      actionUrl: null,
      publishedAt: new Date("2026-02-02T00:00:00.000Z"),
      receipts: [],
    },
  ]);
  mocks.batchFindMany.mockResolvedValue([
    { id: "batch_1", name: "March 2026", course: { name: "200 Hour YTTC" } },
  ]);
  mocks.getCertificateEligibility.mockResolvedValue({
    eligible: false,
    reasons: ["Complete all required hours."],
    completedHours: 10,
    totalHours: 30,
    modulesCompleted: 1,
    modulesRequired: 2,
    completionPercent: 33,
    accessLevel: "FULL",
  });
  mocks.getSiteSettings.mockResolvedValue({
    assets: {
      courseManualUrl: "",
      certificateTemplateUrl: "",
      logoUrl: "",
    },
  });
});

describe("student portal route", () => {
  it("returns 404 with request id when the student profile is missing", async () => {
    mocks.studentFindUnique.mockResolvedValue(null);

    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_portal");
    expect(body).toEqual({ error: "Student not found" });
    expect(mocks.taskProgressCreateMany).not.toHaveBeenCalled();
  });

  it("seeds missing dashboard tasks/modules and returns normalized student portal data", async () => {
    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_portal");
    expect(mocks.taskProgressCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ studentId: "student_1", taskKey: "read_manual" }),
      ]),
      skipDuplicates: true,
    });
    expect(mocks.moduleProgressCreateMany).toHaveBeenCalledWith({
      data: [
        { studentId: "student_1", moduleId: "module_1", moduleTitle: "Anatomy" },
        { studentId: "student_1", moduleId: "module_2", moduleTitle: "Practicum" },
      ],
      skipDuplicates: true,
    });
    expect(mocks.scheduleEntryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { batchId: "batch_1" },
        take: 14,
      }),
    );
    expect(body.student).toEqual(
      expect.objectContaining({
        id: "student_1",
        email: "student@example.com",
        name: "Student One",
        batchId: "batch_1",
        completedHours: 10,
        totalHours: 30,
        paymentSummary: {
          confirmedPayments: 1,
          pendingPayments: 1,
          failedPayments: 0,
          totalPaid: 1499,
        },
      }),
    );
    expect(body.progress).toEqual([
      expect.objectContaining({ moduleId: "module_1", completed: true, hours: 10 }),
      expect.objectContaining({ moduleId: "module_2", completed: false, hours: 20 }),
    ]);
    expect(body.resources[0]).toEqual(expect.objectContaining({ url: "/api/app/resources/resource_1" }));
    expect(body.unreadNotifications).toBe(1);
  });

  it("adds the admin settings course manual to student resources", async () => {
    mocks.taskProgressFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "task_manual", taskKey: "read_manual", taskTitle: "Course Manual", completed: false },
      ]);
    mocks.getSiteSettings.mockResolvedValue({
      assets: {
        courseManualUrl: "https://example.com/course-manual.pdf",
        certificateTemplateUrl: "",
        logoUrl: "",
      },
    });

    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.resources[0]).toEqual(
      expect.objectContaining({
        id: "settings-course-manual",
        title: "Course Manual",
        url: "https://example.com/course-manual.pdf",
        taskKey: "read_manual",
      }),
    );
    expect(body.resources[1]).toEqual(expect.objectContaining({ url: "/api/app/resources/resource_1" }));
    expect(mocks.taskProgressCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ studentId: "student_1", taskKey: "read_manual", taskTitle: "Course Manual" })],
      skipDuplicates: true,
    });
  });

  it("turns admin resource task keys into student checklist tasks", async () => {
    mocks.preArrivalResourceFindMany.mockResolvedValue([
      { id: "resource_1", title: "Visa Guide", taskKey: "review_custom_visa_guide" },
    ]);
    mocks.taskProgressFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "task_resource", taskKey: "review_custom_visa_guide", taskTitle: "Visa Guide", completed: false },
      ]);

    const response = await GET(request());
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.taskProgressCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ studentId: "student_1", taskKey: "review_custom_visa_guide", taskTitle: "Visa Guide" })],
      skipDuplicates: true,
    });
    expect(body.tasks).toEqual([
      expect.objectContaining({ taskKey: "review_custom_visa_guide", taskTitle: "Visa Guide" }),
    ]);
  });
});
