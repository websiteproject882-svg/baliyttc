import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

const optionalTrimmedText = (max: number) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().max(max).nullable().optional());

const httpsOrRelativeUrl = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "URL must use https or start with /");

const galleryImageSchema = z.object({
  url: httpsOrRelativeUrl,
  alt: z.string().trim().max(300).optional(),
  caption: optionalTrimmedText(500),
  category: z.enum(["Practice", "Ceremony", "Campus", "Nature", "Teachers", "Courses"]).default("Practice"),
  type: z.enum(["PROFESSIONAL", "STUDENT"]).default("PROFESSIONAL"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE"]).default("ACTIVE"),
});

const galleryImageUpdateSchema = galleryImageSchema.partial().extend({
  id: z.string().trim().min(1).max(120),
  order: z.coerce.number().int().min(0).optional(),
});

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("gallery.view");
  if (response) return response;

  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
    });
    return jsonWithRequestId({ images }, undefined, request);
  } catch (error) {
    logApiError("admin.gallery.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch gallery" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("gallery.upload");
  if (response) return response;

  try {
    const parsed = galleryImageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { url, alt, caption, category, type, status } = parsed.data;

    const image = await prisma.galleryImage.create({
      data: {
        url,
        alt: alt || url,
        caption,
        category,
        type,
        status,
      },
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "gallery.added",
      entity: "galleryImage",
      entityId: image.id,
      newValue: { url, alt },
      request,
    });

    return jsonWithRequestId({ image }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.gallery.create", error, request, { userId: user!.id });
    return jsonWithRequestId({ error: "Failed to create gallery image" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("gallery.approve");
  if (response) return response;

  try {
    const parsed = galleryImageUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, url, alt, caption, category, type, status, order } = parsed.data;

    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Gallery image not found" }, { status: 404 }, request);
    }

    const updateData: Record<string, unknown> = {};
    if (url !== undefined) updateData.url = url;
    if (alt !== undefined) updateData.alt = alt;
    if (caption !== undefined) updateData.caption = caption;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const image = await prisma.galleryImage.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "gallery.updated",
      entity: "galleryImage",
      entityId: id,
      newValue: updateData,
      request,
    });

    return jsonWithRequestId({ image }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.gallery.update", error, request, { userId: user!.id });
    return jsonWithRequestId({ error: "Failed to update gallery image" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("gallery.delete");
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = deleteQuerySchema.safeParse({ id: searchParams.get("id") });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Gallery image id is required" }, { status: 400 }, request);
    }
    const { id } = parsedQuery.data;

    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Gallery image not found" }, { status: 404 }, request);
    }

    await prisma.galleryImage.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "gallery.deleted",
      entity: "galleryImage",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.gallery.delete", error, request, { userId: user!.id });
    return jsonWithRequestId({ error: "Failed to delete gallery image" }, { status: 500 }, request);
  }
}
