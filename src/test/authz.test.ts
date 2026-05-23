import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  requireAdminUser,
  requirePermission,
  requireStaffUser,
  requireStudentUser,
} from "../lib/authz";
import { requireSameOrigin } from "../lib/security";

type AuthType = "student" | "admin" | "staff";

const mocks = vi.hoisted(() => ({
  sessions: {} as Partial<Record<AuthType, { userId: string; role: string; email: string; authType: AuthType }>>,
  userFindUnique: vi.fn(),
  studentFindUnique: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(() => mocks.sessions.student ?? mocks.sessions.admin ?? mocks.sessions.staff ?? null),
  getAdminSession: vi.fn(() => mocks.sessions.admin ?? null),
  getStaffSession: vi.fn(() => mocks.sessions.staff ?? null),
  getStudentSession: vi.fn(() => mocks.sessions.student ?? null),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    student: {
      findUnique: mocks.studentFindUnique,
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rbac", () => ({
  getPermissions: (role: string) => {
    if (role === "SUPER_ADMIN") return ["*"];
    if (role === "FINANCE_MANAGER") return ["payments.view", "payments.refund"];
    if (role === "SEO_EDITOR") return ["blog.view", "blog.create", "blog.edit"];
    return [];
  },
  hasPermission: (role: string, permission: string) => {
    if (role === "SUPER_ADMIN") return true;
    if (role === "FINANCE_MANAGER") return ["payments.view", "payments.refund"].includes(permission);
    if (role === "SEO_EDITOR") return ["blog.view", "blog.create", "blog.edit"].includes(permission);
    return false;
  },
  isAdminPanelRole: (role: string) =>
    ["SUPER_ADMIN", "STUDENT_MANAGER", "SEO_EDITOR", "FINANCE_MANAGER", "COURSE_MANAGER"].includes(role),
}));

vi.mock("@/lib/security", async () => vi.importActual("../lib/security"));

function mockUser(role: string, overrides: Record<string, unknown> = {}) {
  mocks.userFindUnique.mockResolvedValue({
    id: "user_1",
    email: "user@example.com",
    displayName: "Test User",
    role,
    staff: null,
    ...overrides,
  });
}

async function responseJson(response: Response | null) {
  return response ? response.json() : null;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete mocks.sessions.student;
  delete mocks.sessions.admin;
  delete mocks.sessions.staff;
});

describe("same-origin guard", () => {
  it("allows requests from same origin", () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: {
        origin: "https://example.com",
        host: "example.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(requireSameOrigin(request)).toBeNull();
  });

  it("rejects requests from other origins", () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: {
        origin: "https://evil.com",
        host: "example.com",
        "x-forwarded-proto": "https",
      },
    });

    const response = requireSameOrigin(request);
    expect(response?.status).toBe(403);
  });
});

describe("authz route guards", () => {
  it("requires an admin session for admin routes", async () => {
    mocks.sessions.student = {
      userId: "student_1",
      role: "STUDENT",
      email: "student@example.com",
      authType: "student",
    };

    const { user, response } = await requireAdminUser();

    expect(user).toBeNull();
    expect(response?.status).toBe(401);
    expect(await responseJson(response)).toEqual({ error: "Unauthorized" });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects non-admin roles even when an admin cookie exists", async () => {
    mocks.sessions.admin = {
      userId: "student_1",
      role: "STUDENT",
      email: "student@example.com",
      authType: "admin",
    };
    mockUser("STUDENT");

    const { user, response } = await requireAdminUser();

    expect(user).toBeNull();
    expect(response?.status).toBe(403);
    expect(await responseJson(response)).toEqual({ error: "Forbidden" });
  });

  it("allows super admins through permission checks", async () => {
    mocks.sessions.admin = {
      userId: "admin_1",
      role: "SUPER_ADMIN",
      email: "admin@example.com",
      authType: "admin",
    };
    mockUser("SUPER_ADMIN");

    const { user, response } = await requirePermission("payments.refund");

    expect(response).toBeNull();
    expect(user?.role).toBe("SUPER_ADMIN");
  });

  it("allows active staff admin-panel roles through permission checks", async () => {
    mocks.sessions.staff = {
      userId: "seo_1",
      role: "SEO_EDITOR",
      email: "seo@example.com",
      authType: "staff",
    };
    mockUser("STAFF", {
      staff: {
        id: "staff_seo_1",
        role: "SEO_EDITOR",
        status: "ACTIVE",
        permissions: ["blog.view", "blog.create", "blog.edit"],
      },
    });

    const { user, response } = await requirePermission("blog.edit");

    expect(response).toBeNull();
    expect(user?.role).toBe("SEO_EDITOR");
    expect(user?.authType).toBe("staff");
  });

  it("respects stored staff permissions when they are narrower than the role default", async () => {
    mocks.sessions.staff = {
      userId: "seo_1",
      role: "SEO_EDITOR",
      email: "seo@example.com",
      authType: "staff",
    };
    mockUser("STAFF", {
      staff: {
        id: "staff_seo_1",
        role: "SEO_EDITOR",
        status: "ACTIVE",
        permissions: ["blog.view"],
      },
    });

    const { user, response } = await requirePermission("blog.edit");

    expect(user).toBeNull();
    expect(response?.status).toBe(403);
    expect(await responseJson(response)).toEqual({ error: "Forbidden" });
  });

  it("falls back to role permissions for older staff records without stored permissions", async () => {
    mocks.sessions.staff = {
      userId: "seo_1",
      role: "SEO_EDITOR",
      email: "seo@example.com",
      authType: "staff",
    };
    mockUser("STAFF", {
      staff: {
        id: "staff_seo_1",
        role: "SEO_EDITOR",
        status: "ACTIVE",
        permissions: null,
      },
    });

    const { user, response } = await requirePermission("blog.edit");

    expect(response).toBeNull();
    expect(user?.permissions).toEqual(["blog.view", "blog.create", "blog.edit"]);
  });

  it("rejects teacher staff sessions from admin routes", async () => {
    mocks.sessions.staff = {
      userId: "teacher_1",
      role: "TEACHER",
      email: "teacher@example.com",
      authType: "staff",
    };
    mockUser("STAFF", {
      staff: {
        id: "staff_teacher_1",
        role: "TEACHER",
        status: "ACTIVE",
        permissions: [],
      },
    });

    const { user, response } = await requireAdminUser();

    expect(user).toBeNull();
    expect(response?.status).toBe(403);
  });

  it("rejects admin roles without the requested permission", async () => {
    mocks.sessions.admin = {
      userId: "seo_1",
      role: "SEO_EDITOR",
      email: "seo@example.com",
      authType: "admin",
    };
    mockUser("SEO_EDITOR");

    const { user, response } = await requirePermission("payments.refund");

    expect(user).toBeNull();
    expect(response?.status).toBe(403);
    expect(await responseJson(response)).toEqual({ error: "Forbidden" });
  });

  it("allows teacher staff sessions for teacher routes", async () => {
    mocks.sessions.staff = {
      userId: "teacher_1",
      role: "TEACHER",
      email: "teacher@example.com",
      authType: "staff",
    };
    mockUser("STAFF", {
      staff: {
        id: "staff_1",
        role: "TEACHER",
        status: "ACTIVE",
        permissions: [],
      },
    });

    const { user, response } = await requireStaffUser();

    expect(response).toBeNull();
    expect(user?.role).toBe("TEACHER");
    expect(user?.staffId).toBe("staff_1");
  });

  it("blocks student routes unless the student cookie is present", async () => {
    mocks.sessions.admin = {
      userId: "admin_1",
      role: "SUPER_ADMIN",
      email: "admin@example.com",
      authType: "admin",
    };

    const { user, student, response } = await requireStudentUser();

    expect(user).toBeNull();
    expect(student).toBeNull();
    expect(response?.status).toBe(401);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("uses paid enrollment batch as the student batch fallback", async () => {
    mocks.sessions.student = {
      userId: "student_1",
      role: "STUDENT",
      email: "student@example.com",
      authType: "student",
    };
    mockUser("STUDENT");
    mocks.studentFindUnique.mockResolvedValue({
      id: "student_profile_1",
      userId: "student_1",
      accessLevel: "PRE_ARRIVAL",
      paymentStatus: "DEPOSIT_PAID",
      batchId: null,
      enrolledCourse: "200 Hour YTTC",
      enrollments: [{ batchId: "batch_paid_1" }],
    });

    const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });

    expect(response).toBeNull();
    expect(student?.batchId).toBe("batch_paid_1");
  });

  it("enforces student access levels", async () => {
    mocks.sessions.student = {
      userId: "student_1",
      role: "STUDENT",
      email: "student@example.com",
      authType: "student",
    };
    mockUser("STUDENT");
    mocks.studentFindUnique.mockResolvedValue({
      id: "student_profile_1",
      userId: "student_1",
      accessLevel: "PRE_ARRIVAL",
      paymentStatus: "DEPOSIT_PAID",
      batchId: "batch_1",
      enrolledCourse: "200 Hour YTTC",
      enrollments: [],
    });

    const { user, student, response } = await requireStudentUser({ minimumAccess: "FULL" });

    expect(user).toBeNull();
    expect(student).toBeNull();
    expect(response?.status).toBe(403);
    expect(await responseJson(response)).toEqual({ error: "Student access is not active" });
  });
});
