import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, getAdminSession, getStaffSession, getStudentSession, AuthType } from "@/lib/session";
import { hasPermission, isAdminPanelRole, type AppRole } from "@/lib/rbac";
export { requireSameOrigin } from "@/lib/security";

// Expand AppRole to include all possible roles
type ExpandedAppRole = AppRole | 'ADMIN';

type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: ExpandedAppRole;
  permissions: string[];
  staffId?: string;
  authType: AuthType;
};

export type CurrentStudent = {
  id: string;
  userId: string;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  paymentStatus: string;
  batchId: string | null;
  enrolledCourse: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function getCurrentUser(authType?: AuthType): Promise<CurrentUser | null> {
  const session = authType === 'admin'
    ? await getAdminSession()
    : authType === 'staff'
      ? await getStaffSession()
      : authType === 'student'
        ? await getStudentSession()
        : await getSession();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: String(session.userId) },
    include: {
      staff: true,
    },
  });

  if (!user) {
    return null;
  }

  const role: ExpandedAppRole = user.staff?.status === "ACTIVE"
    ? (user.staff.role as ExpandedAppRole)
    : (user.role as ExpandedAppRole);
  const permissions =
    user.staff?.status === "ACTIVE"
      ? ((user.staff.permissions as string[] | null) ?? [])
      : [];

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role,
    permissions,
    staffId: user.staff?.id,
    authType: (session as any).authType || authType || 'student',
  };
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: jsonError("Unauthorized", 401) };
  }
  return { user, response: null };
}

export async function requireStudentUser(options?: { minimumAccess?: "PRE_ARRIVAL" | "FULL" | "ALUMNI" }) {
  const user = await getCurrentUser('student');
  if (!user) {
    return { user: null, student: null, response: jsonError("Unauthorized", 401) };
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { batchId: true },
      },
    },
  });

  if (!student) {
    return { user: null, student: null, response: jsonError("Student profile not found", 404) };
  }

  if (options?.minimumAccess) {
    const ranking = { NONE: 0, PRE_ARRIVAL: 1, FULL: 2, ALUMNI: 3 } as const;
    if (ranking[student.accessLevel] < ranking[options.minimumAccess]) {
      return { user: null, student: null, response: jsonError("Student access is not active", 403) };
    }
  }

  const effectiveBatchId = student.batchId || student.enrollments[0]?.batchId || null;

  return {
    user,
    student: {
      id: student.id,
      userId: student.userId,
      accessLevel: student.accessLevel,
      paymentStatus: student.paymentStatus,
      batchId: effectiveBatchId,
      enrolledCourse: student.enrolledCourse,
    } as CurrentStudent,
    response: null,
  };
}

export async function requireAdminUser() {
  const user = (await getCurrentUser('admin')) ?? (await getCurrentUser('staff'));
  if (!user) {
    return { user: null, response: jsonError("Unauthorized", 401) };
  }

  if (!isAdminPanelRole(user.role as AppRole) && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { user: null, response: jsonError("Forbidden", 403) };
  }

  return { user, response: null };
}

export async function requireStaffUser() {
  const user = await getCurrentUser('staff');
  if (!user) {
    return { user: null, response: jsonError("Unauthorized", 401) };
  }

  const staffRoles: ExpandedAppRole[] = ['TEACHER', 'SEO_EDITOR', 'FINANCE_MANAGER', 'COURSE_MANAGER'];
  if (!staffRoles.includes(user.role)) {
    return { user: null, response: jsonError("Forbidden", 403) };
  }

  return { user, response: null };
}

export async function requirePermission(permission: string) {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return { user: null, response };
  }

  if (!hasPermission(user.role, permission)) {
    return { user: null, response: jsonError("Forbidden", 403) };
  }

  return { user, response: null };
}

export async function requireSuperAdmin() {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return { user: null, response };
  }

  if (user.role !== "SUPER_ADMIN") {
    return { user: null, response: jsonError("Forbidden", 403) };
  }

  return { user, response: null };
}

export async function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  request?: NextRequest;
}) {
  const ipAddress =
    params.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    params.request?.headers.get("x-real-ip") ||
    null;
  const userAgent = params.request?.headers.get("user-agent") || null;

  await prisma.auditLog.create({
    data: {
      userId: params.actorUserId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValue: params.oldValue as object | undefined,
      newValue: params.newValue as object | undefined,
      ipAddress,
      userAgent,
    },
  });
}
