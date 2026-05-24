import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const reactionSchema = z.object({
  announcementId: z.string().trim().min(1).max(120),
  emoji: z.string().trim().min(1).max(16),
});

const replySchema = z.object({
  announcementId: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(500),
});

const reactionEmojiByCode: Record<string, string> = {
  PRAY: "\u{1F64F}",
  LOVE: "\u2764\uFE0F",
  LIKE: "\u{1F44D}",
  CELEBRATE: "\u{1F389}",
  FIRE: "\u{1F525}",
};

function normalizeReactionEmoji(input: string) {
  const fromCode = reactionEmojiByCode[input];
  if (fromCode) {
    return fromCode;
  }
  return Object.values(reactionEmojiByCode).includes(input) ? input : null;
}

function canViewAnnouncement(params: {
  announcement: { batchId: string | null; type: "GENERAL" | "BATCH" | "URGENT"; publishedAt: Date | null };
  studentBatchId: string | null;
}) {
  if (!params.announcement.publishedAt) return false;
  if (params.announcement.type === "GENERAL" || params.announcement.type === "URGENT") return true;
  return Boolean(params.studentBatchId && params.announcement.batchId === params.studentBatchId);
}

export async function GET(request: NextRequest) {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        publishedAt: { not: null },
        OR: [
          { type: "GENERAL" },
          { type: "URGENT" },
          ...(student.batchId ? [{ batchId: student.batchId }] : []),
        ],
      },
      include: {
        reactionRows: true,
        replies: {
          orderBy: { createdAt: "asc" },
          take: 20,
          include: {
            student: {
              select: {
                user: { select: { displayName: true, photoURL: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return jsonWithRequestId(
      {
        announcements: announcements.map((announcement) => {
          const reactionCounts = announcement.reactionRows.reduce<Record<string, number>>((counts, reaction) => {
            counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
            return counts;
          }, {});
          const ownReaction = announcement.reactionRows.find((reaction) => reaction.studentId === student.id)?.emoji || null;

          return {
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            publishedAt: announcement.publishedAt,
            createdAt: announcement.createdAt,
            reactionCounts,
            ownReaction,
            replies: announcement.replies.map((reply) => ({
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt,
              authorName: reply.student.user.displayName || "Student",
              authorPhotoURL: reply.student.user.photoURL || null,
              mine: reply.studentId === student.id,
            })),
          };
        }),
      },
      undefined,
      request,
    );
  } catch (error) {
    logApiError("app.announcements.list", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to load announcements" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const payload = await request.json().catch(() => null);
    const result = reactionSchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const data = result.data;
    const emoji = normalizeReactionEmoji(data.emoji);
    if (!emoji) {
      return jsonWithRequestId({ error: "Unsupported reaction" }, { status: 400 }, request);
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: data.announcementId },
      select: { id: true, batchId: true, type: true, publishedAt: true },
    });
    if (!announcement || !canViewAnnouncement({ announcement, studentBatchId: student.batchId })) {
      return jsonWithRequestId({ error: "Announcement not found" }, { status: 404 }, request);
    }

    const existing = await prisma.announcementReaction.findUnique({
      where: {
        announcementId_studentId: {
          announcementId: data.announcementId,
          studentId: student.id,
        },
      },
    });

    if (existing?.emoji === emoji) {
      await prisma.announcementReaction.delete({ where: { id: existing.id } });
      return jsonWithRequestId({ success: true, reaction: null }, undefined, request);
    }

    const reaction = await prisma.announcementReaction.upsert({
      where: {
        announcementId_studentId: {
          announcementId: data.announcementId,
          studentId: student.id,
        },
      },
      update: { emoji },
      create: {
        announcementId: data.announcementId,
        studentId: student.id,
        emoji,
      },
    });

    return jsonWithRequestId({ success: true, reaction }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.announcements.reaction", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to save reaction" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const payload = await request.json().catch(() => null);
    const result = replySchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const data = result.data;
    const announcement = await prisma.announcement.findUnique({
      where: { id: data.announcementId },
      select: { id: true, batchId: true, type: true, publishedAt: true },
    });
    if (!announcement || !canViewAnnouncement({ announcement, studentBatchId: student.batchId })) {
      return jsonWithRequestId({ error: "Announcement not found" }, { status: 404 }, request);
    }

    const reply = await prisma.announcementReply.create({
      data: {
        announcementId: data.announcementId,
        studentId: student.id,
        content: data.content,
      },
    });

    return jsonWithRequestId({ success: true, reply }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.announcements.reply", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to save reply" }, { status: 500 }, request);
  }
}
