import { NextRequest } from "next/server";
import { StaffRole, StaffStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireSuperAdmin, writeAuditLog } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const createStaffSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2).max(120),
  role: z.nativeEnum(StaffRole),
});

const updateStaffSchema = z.object({
  id: z.string().trim().min(1).max(120),
  role: z.nativeEnum(StaffRole).optional(),
  status: z.nativeEnum(StaffStatus).optional(),
  name: z.string().trim().min(2).max(120).optional(),
});

const toggleStaffSchema = z.object({
  staffId: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

async function wouldRemoveLastActiveSuperAdmin(params: {
  currentRole: StaffRole;
  currentStatus: StaffStatus;
  nextRole?: StaffRole;
  nextStatus?: StaffStatus;
}) {
  if (params.currentRole !== StaffRole.SUPER_ADMIN || params.currentStatus !== StaffStatus.ACTIVE) {
    return false;
  }

  const nextRole = params.nextRole ?? params.currentRole;
  const nextStatus = params.nextStatus ?? params.currentStatus;
  const remainsActiveSuperAdmin = nextRole === StaffRole.SUPER_ADMIN && nextStatus === StaffStatus.ACTIVE;

  if (remainsActiveSuperAdmin) {
    return false;
  }

  const superAdminCount = await prisma.staff.count({
    where: { role: StaffRole.SUPER_ADMIN, status: StaffStatus.ACTIVE },
  });

  return superAdminCount <= 1;
}

export async function GET(request: NextRequest) {
  const { response } = await requireSuperAdmin();
  if (response) {
    return response;
  }

  try {
    const staff = await prisma.staff.findMany({
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

    return jsonWithRequestId({
      staff: staff.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        name: member.user.displayName,
        role: member.role,
        status: member.status,
        permissions: (member.permissions as string[] | null) ?? PERMISSIONS[member.role] ?? [],
        invitedAt: member.invitedAt,
        lastLogin: member.lastLogin,
      })),
    }, undefined, request);
  } catch (error) {
    logApiError("admin.staff.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch staff" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireSuperAdmin();
  if (!user || response) {
    return response;
  }

  try {
    const parsed = createStaffSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      include: { staff: true },
    });

    let staffRecord;

    if (existing?.staff) {
      if (
        await wouldRemoveLastActiveSuperAdmin({
          currentRole: existing.staff.role,
          currentStatus: existing.staff.status,
          nextRole: data.role,
          nextStatus: StaffStatus.PENDING,
        })
      ) {
        return jsonWithRequestId(
          { error: "Cannot remove the last active admin account" },
          { status: 400 },
          request,
        );
      }

      staffRecord = await prisma.staff.update({
        where: { id: existing.staff.id },
        data: {
          role: data.role,
          status: StaffStatus.PENDING,
          permissions: PERMISSIONS[data.role],
        },
        include: {
          user: {
            select: { email: true, displayName: true },
          },
        },
      });
    } else {
      const created = await prisma.user.upsert({
        where: { email: data.email },
        update: {
          displayName: data.name,
          role: data.role === StaffRole.TEACHER ? UserRole.TEACHER : UserRole.STAFF,
        },
        create: {
          email: data.email,
          displayName: data.name,
          uid: `staff-${Date.now()}`,
          role: data.role === StaffRole.TEACHER ? UserRole.TEACHER : UserRole.STAFF,
        },
      });

      staffRecord = await prisma.staff.create({
        data: {
          userId: created.id,
          role: data.role,
          status: StaffStatus.PENDING,
          permissions: PERMISSIONS[data.role],
        },
        include: {
          user: {
            select: { email: true, displayName: true },
          },
        },
      });
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: "staff.invited",
      entity: "staff",
      entityId: staffRecord.id,
      newValue: {
        role: staffRecord.role,
        status: staffRecord.status,
        email: staffRecord.user.email,
      },
      request,
    });

    return jsonWithRequestId({
      success: true,
      staff: {
        id: staffRecord.id,
        userId: staffRecord.userId,
        email: staffRecord.user.email,
        name: staffRecord.user.displayName,
        role: staffRecord.role,
        status: staffRecord.status,
        permissions: (staffRecord.permissions as string[] | null) ?? PERMISSIONS[staffRecord.role],
        invitedAt: staffRecord.invitedAt,
        lastLogin: staffRecord.lastLogin,
      },
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }

    logApiError("admin.staff.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create staff" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireSuperAdmin();
  if (!user || response) {
    return response;
  }

  try {
    const parsed = updateStaffSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.staff.findUnique({
      where: { id: data.id },
      include: {
        user: true,
      },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Staff member not found" }, { status: 404 }, request);
    }

    if (
      await wouldRemoveLastActiveSuperAdmin({
        currentRole: existing.role,
        currentStatus: existing.status,
        nextRole: data.role,
        nextStatus: data.status,
      })
    ) {
      return jsonWithRequestId(
        { error: "Cannot remove the last active admin account" },
        { status: 400 },
        request,
      );
    }

    const updated = await prisma.staff.update({
      where: { id: data.id },
      data: {
        role: data.role,
        status: data.status,
        permissions: data.role ? PERMISSIONS[data.role] : undefined,
      },
      include: {
        user: true,
      },
    });

    if (data.name || data.role) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          displayName: data.name,
          role: data.role
            ? data.role === StaffRole.TEACHER
              ? UserRole.TEACHER
              : UserRole.STAFF
            : undefined,
        },
      });
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: "staff.updated",
      entity: "staff",
      entityId: updated.id,
      oldValue: {
        role: existing.role,
        status: existing.status,
        name: existing.user.displayName,
      },
      newValue: {
        role: updated.role,
        status: updated.status,
        name: data.name ?? existing.user.displayName,
      },
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }

    logApiError("admin.staff.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update staff" }, { status: 500 }, request);
  }
}

// Separate endpoint for toggling staff access ON/OFF
export async function PUT(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireSuperAdmin();
  if (!user || response) {
    return response;
  }

  try {
    const parsed = toggleStaffSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { staffId, enabled } = parsed.data;

    const existing = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Staff member not found" }, { status: 404 }, request);
    }

    // Prevent disabling the last SUPER_ADMIN
    if (existing.role === StaffRole.SUPER_ADMIN && !enabled) {
      const superAdminCount = await prisma.staff.count({
        where: { role: StaffRole.SUPER_ADMIN, status: StaffStatus.ACTIVE },
      });
      if (superAdminCount <= 1) {
        return jsonWithRequestId(
          { error: "Cannot disable the last admin account" },
          { status: 400 },
          request,
        );
      }
    }

    const newStatus = enabled ? StaffStatus.ACTIVE : StaffStatus.INACTIVE;
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { status: newStatus },
      include: { user: true },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: enabled ? "staff.enabled" : "staff.disabled",
      entity: "staff",
      entityId: updated.id,
      oldValue: { status: existing.status },
      newValue: { status: newStatus },
      request,
    });

    return jsonWithRequestId({
      success: true,
      staff: {
        id: updated.id,
        userId: updated.userId,
        email: updated.user.email,
        name: updated.user.displayName,
        role: updated.role,
        status: updated.status,
        permissions: (updated.permissions as string[] | null) ?? PERMISSIONS[updated.role],
        lastLogin: updated.lastLogin,
      },
      message: enabled
        ? `${updated.user.displayName || 'Staff'} access has been enabled`
        : `${updated.user.displayName || 'Staff'} access has been disabled`,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }

    logApiError("admin.staff.toggle", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to toggle staff access" }, { status: 500 }, request);
  }
}
