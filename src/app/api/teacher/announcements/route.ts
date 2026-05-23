import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUserHasPermission, requireAuthenticatedUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "announcements.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("GET announcements error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  if (user.role !== "TEACHER" && !currentUserHasPermission(user, "announcements.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, content, type = "GENERAL", batchId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("POST announcement error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAuthenticatedUser();
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const canManageAny = currentUserHasPermission(user, "announcements.edit");
    const canManageOwn = user.role === "TEACHER" && existing.authorId === user.id;
    if (!canManageAny && !canManageOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE announcement error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
