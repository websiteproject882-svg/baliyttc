import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export async function GET() {
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
    const body = await request.json();
    const { url, alt, caption, type, featured, status } = body;

    const image = await prisma.galleryImage.create({
      data: {
        url,
        alt: alt || url,
        caption,
        type: (type as "PROFESSIONAL" | "STUDENT") || "PROFESSIONAL",
        status: (status as "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE") || "ACTIVE",
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
    const body = await request.json();
    const { id, url, alt, caption, type, status, order } = body;

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
