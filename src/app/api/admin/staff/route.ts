import { NextRequest, NextResponse } from "next/server";
import { StaffRole, StaffStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireSuperAdmin, writeAuditLog } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(StaffRole),
});

const updateStaffSchema = z.object({
  id: z.string(),
  role: z.nativeEnum(StaffRole).optional(),
  status: z.nativeEnum(StaffStatus).optional(),
  name: z.string().min(2).optional(),
});

export async function GET() {
  const { response } = await requireSuperAdmin();
  if (response) {
    return response;
  }

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

  return NextResponse.json({
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
  });
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
    const data = createStaffSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      include: { staff: true },
    });

    let staffRecord;

    if (existing?.staff) {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("POST admin staff error:", error);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
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
    const data = updateStaffSchema.parse(await request.json());
    const existing = await prisma.staff.findUnique({
      where: { id: data.id },
      include: {
        user: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("PATCH admin staff error:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
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
    const { staffId, enabled } = await request.json();

    if (!staffId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: "Missing staffId or enabled status" },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Prevent disabling the last SUPER_ADMIN
    if (existing.role === 'SUPER_ADMIN' && !enabled) {
      const superAdminCount = await prisma.staff.count({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot disable the last admin account" },
          { status: 400 }
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("PUT admin staff toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle staff access" }, { status: 500 });
  }
}
