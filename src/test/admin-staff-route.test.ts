import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, POST, PUT } from "../app/api/admin/staff/route";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  staffFindMany: vi.fn(),
  staffFindUnique: vi.fn(),
  staffCreate: vi.fn(),
  staffUpdate: vi.fn(),
  staffCount: vi.fn(),
  userFindUnique: vi.fn(),
  userUpsert: vi.fn(),
  userUpdate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    staff: {
      findMany: mocks.staffFindMany,
      findUnique: mocks.staffFindUnique,
      create: mocks.staffCreate,
      update: mocks.staffUpdate,
      count: mocks.staffCount,
    },
    user: {
      findUnique: mocks.userFindUnique,
      upsert: mocks.userUpsert,
      update: mocks.userUpdate,
    },
  },
}));

vi.mock("@/lib/rbac", () => ({
  PERMISSIONS: {
    SUPER_ADMIN: ["*"],
    COURSE_MANAGER: ["courses.view", "courses.edit"],
    SEO_EDITOR: ["blog.view", "faq.edit"],
    TEACHER: ["schedule.view", "students.view_own_batch"],
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
  role: "SUPER_ADMIN",
  permissions: ["*"],
  authType: "admin",
};

const user = {
  id: "user_1",
  email: "teacher@example.com",
  displayName: "Teacher One",
  role: "STAFF",
};

const staff = {
  id: "staff_1",
  userId: "user_1",
  user,
  role: "COURSE_MANAGER",
  status: "PENDING",
  permissions: ["courses.view"],
  invitedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  lastLogin: null,
};

function request(method: "GET" | "POST" | "PATCH" | "PUT", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/staff", {
    method,
    headers: {
      "x-request-id": "req_admin_staff",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH" | "PUT", body: string) {
  return new NextRequest("https://example.com/api/admin/staff", {
    method,
    headers: {
      "x-request-id": "req_admin_staff",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireSuperAdmin.mockResolvedValue({ user: admin, response: null });
  mocks.staffFindMany.mockResolvedValue([staff]);
  mocks.staffFindUnique.mockResolvedValue(staff);
  mocks.staffCreate.mockResolvedValue(staff);
  mocks.staffUpdate.mockImplementation(({ data }) => Promise.resolve({ ...staff, ...data }));
  mocks.staffCount.mockResolvedValue(2);
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userUpsert.mockResolvedValue(user);
  mocks.userUpdate.mockResolvedValue(user);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin staff route", () => {
  it("lists staff with request ids and permission fallback", async () => {
    mocks.staffFindMany.mockResolvedValue([{ ...staff, permissions: null }]);

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_staff");
    expect(body.staff[0]).toMatchObject({
      id: "staff_1",
      email: "teacher@example.com",
      role: "COURSE_MANAGER",
      permissions: expect.arrayContaining(["courses.view"]),
    });
    expect(mocks.staffFindMany).toHaveBeenCalledWith({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("invites new staff, normalizes email, and writes an audit log", async () => {
    const response = await POST(request("POST", {
      email: " Teacher@Example.COM ",
      name: " Teacher One ",
      role: "COURSE_MANAGER",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "teacher@example.com" },
      include: { staff: true },
    });
    expect(mocks.userUpsert).toHaveBeenCalledWith({
      where: { email: "teacher@example.com" },
      update: {
        displayName: "Teacher One",
        role: "STAFF",
      },
      create: expect.objectContaining({
        email: "teacher@example.com",
        displayName: "Teacher One",
        role: "STAFF",
      }),
    });
    expect(mocks.staffCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        role: "COURSE_MANAGER",
        status: "PENDING",
        permissions: expect.arrayContaining(["courses.view"]),
      },
      include: {
        user: {
          select: { email: true, displayName: true },
        },
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "staff.invited",
        entity: "staff",
        entityId: "staff_1",
      }),
    );
  });

  it("reinvites an existing user with staff access", async () => {
    mocks.userFindUnique.mockResolvedValue({ ...user, staff: { id: "staff_existing" } });

    const response = await POST(request("POST", {
      email: "teacher@example.com",
      name: "Teacher One",
      role: "SEO_EDITOR",
    }));

    expect(response?.status).toBe(200);
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_existing" },
      data: {
        role: "SEO_EDITOR",
        status: "PENDING",
        permissions: expect.arrayContaining(["blog.view"]),
      },
      include: {
        user: {
          select: { email: true, displayName: true },
        },
      },
    });
    expect(mocks.staffCreate).not.toHaveBeenCalled();
  });

  it("prevents reinviting the last active super admin into a non-owner role", async () => {
    mocks.userFindUnique.mockResolvedValue({
      ...user,
      staff: { id: "staff_owner", role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    mocks.staffCount.mockResolvedValue(1);

    const response = await POST(request("POST", {
      email: "owner@example.com",
      name: "Owner One",
      role: "SEO_EDITOR",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Cannot remove the last active admin account");
    expect(mocks.staffCount).toHaveBeenCalledWith({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
  });

  it("validates invite payloads", async () => {
    const response = await POST(request("POST", {
      email: "not-an-email",
      name: "A",
      role: "COURSE_MANAGER",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.staffCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed staff invite JSON before user lookup", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_staff");
    expect(body.error).toBe("Validation failed");
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.staffCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates staff roles, status, profile name, and audit log", async () => {
    const response = await PATCH(request("PATCH", {
      id: "staff_1",
      name: "Updated Manager",
      role: "TEACHER",
      status: "ACTIVE",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: {
        role: "TEACHER",
        status: "ACTIVE",
        permissions: expect.arrayContaining(["schedule.view"]),
      },
      include: { user: true },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        displayName: "Updated Manager",
        role: "TEACHER",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "staff.updated",
        entity: "staff",
        entityId: "staff_1",
      }),
    );
  });

  it("returns 404 when updating missing staff", async () => {
    mocks.staffFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", { id: "missing", status: "ACTIVE" }));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Staff member not found");
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
  });

  it("prevents downgrading the last active super admin", async () => {
    mocks.staffFindUnique.mockResolvedValue({ ...staff, role: "SUPER_ADMIN", status: "ACTIVE" });
    mocks.staffCount.mockResolvedValue(1);

    const response = await PATCH(request("PATCH", {
      id: "staff_1",
      role: "COURSE_MANAGER",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Cannot remove the last active admin account");
    expect(mocks.staffCount).toHaveBeenCalledWith({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("prevents deactivating the last active super admin via profile update", async () => {
    mocks.staffFindUnique.mockResolvedValue({ ...staff, role: "SUPER_ADMIN", status: "ACTIVE" });
    mocks.staffCount.mockResolvedValue(1);

    const response = await PATCH(request("PATCH", {
      id: "staff_1",
      status: "INACTIVE",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Cannot remove the last active admin account");
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed staff update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_staff");
    expect(body.error).toBe("Validation failed");
    expect(mocks.staffFindUnique).not.toHaveBeenCalled();
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("validates toggle payloads", async () => {
    const response = await PUT(request("PUT", { staffId: "staff_1", enabled: "yes" }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed staff toggle JSON before lookup", async () => {
    const response = await PUT(rawRequest("PUT", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_staff");
    expect(body.error).toBe("Validation failed");
    expect(mocks.staffFindUnique).not.toHaveBeenCalled();
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("prevents disabling the last active super admin", async () => {
    mocks.staffFindUnique.mockResolvedValue({ ...staff, role: "SUPER_ADMIN", status: "ACTIVE" });
    mocks.staffCount.mockResolvedValue(1);

    const response = await PUT(request("PUT", { staffId: "staff_1", enabled: false }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Cannot disable the last admin account");
    expect(mocks.staffCount).toHaveBeenCalledWith({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    expect(mocks.staffUpdate).not.toHaveBeenCalled();
  });

  it("toggles staff access and writes an audit log", async () => {
    const response = await PUT(request("PUT", { staffId: "staff_1", enabled: true }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.staff.status).toBe("ACTIVE");
    expect(mocks.staffUpdate).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: { status: "ACTIVE" },
      include: { user: true },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "staff.enabled",
        oldValue: { status: "PENDING" },
        newValue: { status: "ACTIVE" },
      }),
    );
  });

  it("logs toggle failures without leaking internals", async () => {
    mocks.staffUpdate.mockRejectedValue(new Error("database down"));

    const response = await PUT(request("PUT", { staffId: "staff_1", enabled: true }));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to toggle staff access");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.staff.toggle",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
