import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";

const galleryImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(300).optional(),
  caption: z.string().max(500).nullable().optional(),
  type: z.enum(["PROFESSIONAL", "STUDENT"]).default("PROFESSIONAL"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE"]).default("ACTIVE"),
});

const galleryImageUpdateSchema = galleryImageSchema.partial().extend({
  id: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { url, alt, caption, type, status } = galleryImageSchema.parse(await request.json());

    const image = await prisma.galleryImage.create({
      data: {
        url,
        alt: alt || url,
        caption,
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

    return NextResponse.json({ image });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Gallery create error:", error);
    return NextResponse.json({ error: "Failed to create gallery image" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { id, url, alt, caption, type, status, order } = galleryImageUpdateSchema.parse(await request.json());

    const updateData: Record<string, unknown> = {};
    if (url !== undefined) updateData.url = url;
    if (alt !== undefined) updateData.alt = alt;
    if (caption !== undefined) updateData.caption = caption;
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

    return NextResponse.json({ image });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Gallery update error:", error);
    return NextResponse.json({ error: "Failed to update gallery image" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Image ID required" }, { status: 400 });
    }

    await prisma.galleryImage.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "gallery.deleted",
      entity: "galleryImage",
      entityId: id,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json({ error: "Failed to delete gallery image" }, { status: 500 });
  }
}
