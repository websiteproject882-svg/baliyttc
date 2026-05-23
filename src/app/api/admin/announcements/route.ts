import { NextRequest } from "next/server";
import { AnnouncementType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().min(1).max(max).optional());

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(10).max(5000),
  type: z.nativeEnum(AnnouncementType),
  batchId: optionalTrimmed(120),
});

const announcementUpdateSchema = announcementSchema.extend({
  id: z.string().trim().min(1).max(120),
});

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("announcements.view");
  if (response) {
    return response;
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonWithRequestId({ announcements }, undefined, request);
  } catch (error) {
    logApiError("admin.announcements.list", error, request);
    return jsonWithRequestId({ error: "Failed to load announcements" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.create");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        batchId: data.batchId || null,
        authorId: user.id,
        publishedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "announcement.created",
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
    logApiError("admin.announcements.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create announcement" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.edit");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = announcementUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.announcement.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Announcement not found" }, { status: 404 }, request);
    }

    const announcement = await prisma.announcement.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        batchId: data.batchId || null,
        publishedAt: existing.publishedAt || new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "announcement.updated",
      entity: "announcement",
      entityId: announcement.id,
      oldValue: existing,
      newValue: announcement,
      request,
    });

    return jsonWithRequestId({ success: true, announcement }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.announcements.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update announcement" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("announcements.edit");
  if (!user || response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = deleteQuerySchema.safeParse({ id: searchParams.get("id") });
  if (!parsedQuery.success) {
    return jsonWithRequestId({ error: "Announcement id is required" }, { status: 400 }, request);
  }
  const { id } = parsedQuery.data;

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Announcement not found" }, { status: 404 }, request);
    }

    await prisma.announcement.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "announcement.deleted",
      entity: "announcement",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.announcements.delete", error, request, { announcementId: id, userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete announcement" }, { status: 500 }, request);
  }
}
