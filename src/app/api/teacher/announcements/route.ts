import { AnnouncementType } from "@prisma/client";
import { z } from "zod";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { currentUserHasPermission, requireSameOrigin, requireStaffUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(5000),
  type: z.nativeEnum(AnnouncementType).default("GENERAL"),
  batchId: z.string().trim().min(1).max(120).optional().transform((value) => value || undefined),
});

const announcementListQuerySchema = z.object({
  batchId: z.string().trim().min(1).max(120).optional(),
});

const announcementDeleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "announcements.view")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = announcementListQuerySchema.safeParse({
      batchId: searchParams.get("batchId") ?? undefined,
    });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsedQuery.error.errors }, { status: 400 }, request);
    }
    const { batchId } = parsedQuery.data;

    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return jsonWithRequestId({ announcements }, undefined, request);
  } catch (error) {
    logApiError("teacher.announcements.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch announcements" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "announcements.create")) {
    return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
  }

  try {
    const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { title, content, type, batchId } = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        batchId,
        authorId: user.id,
        publishedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "teacher.announcement.created",
      entity: "announcement",
      entityId: announcement.id,
      newValue: announcement,
      request,
    });

    return jsonWithRequestId({ success: true, announcement }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("teacher.announcements.create", error, request);
    return jsonWithRequestId({ error: "Failed to create announcement" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireStaffUser();
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");

    if (!rawId) return jsonWithRequestId({ error: "id is required" }, { status: 400 }, request);
    const parsedQuery = announcementDeleteQuerySchema.safeParse({ id: rawId });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Invalid id" }, { status: 400 }, request);
    }
    const { id } = parsedQuery.data;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Announcement not found" }, { status: 404 }, request);
    }

    const canManageAny = currentUserHasPermission(user, "announcements.edit");
    const canManageOwn = user.role === "TEACHER" && existing.authorId === user.id;
    if (!canManageAny && !canManageOwn) {
      return jsonWithRequestId({ error: "Forbidden" }, { status: 403 }, request);
    }

    await prisma.announcement.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "teacher.announcement.deleted",
      entity: "announcement",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("teacher.announcements.delete", error, request);
    return jsonWithRequestId({ error: "Failed to delete announcement" }, { status: 500 }, request);
  }
}
