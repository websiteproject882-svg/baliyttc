import { WaitlistStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { sendEmail } from "@/lib/resend";
import { getClientIp, jsonWithRequestId, logApiError, rateLimit } from "@/lib/security";

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional().transform((value) => value || undefined),
  courseSlug: z.string().trim().min(1).max(80),
  batchId: z.string().trim().min(1).max(120).optional().transform((value) => value || undefined),
});

const waitlistUpdateSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: z.nativeEnum(WaitlistStatus).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  notes: z.string().trim().max(3000).nullable().optional(),
});

const optionalTrimmedQuery = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().min(1).max(max).optional());

const waitlistListQuerySchema = z.object({
  batchId: optionalTrimmedQuery(120),
  status: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  }, z.nativeEnum(WaitlistStatus).optional()),
  course: optionalTrimmedQuery(80),
});

const waitlistDeleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("waitlist.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = waitlistListQuerySchema.safeParse({
      batchId: searchParams.get("batchId"),
      status: searchParams.get("status"),
      course: searchParams.get("course"),
    });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsedQuery.error.errors }, { status: 400 }, request);
    }
    const { batchId, status, course: courseSlug } = parsedQuery.data;

    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;
    if (status) where.status = status;
    if (courseSlug) where.courseSlug = courseSlug;

    const waitlist = await prisma.waitlist.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // Count stats
    const [total, waiting, notified, converted] = await Promise.all([
      prisma.waitlist.count({ where }),
      prisma.waitlist.count({ where: { ...where, status: "WAITING" } }),
      prisma.waitlist.count({ where: { ...where, status: "NOTIFIED" } }),
      prisma.waitlist.count({ where: { ...where, status: "CONVERTED" } }),
    ]);

    return jsonWithRequestId({
      waitlist,
      stats: { total, waiting, notified, converted },
    }, undefined, request);
  } catch (error) {
    logApiError("waitlist.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch waitlist" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sameOriginResponse = requireSameOrigin(request);
    if (sameOriginResponse) {
      return sameOriginResponse;
    }

    const limit = rateLimit({
      key: `public:waitlist:${getClientIp(request)}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: "Too many waitlist attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const parsed = waitlistSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }
    const data = parsed.data;

    // Check if already on waitlist
    const existing = await prisma.waitlist.findFirst({
      where: {
        email: data.email,
        courseSlug: data.courseSlug,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
    });

    if (existing) {
      return jsonWithRequestId({
        error: "You're already on the waitlist for this course",
        waitlist: existing,
      }, undefined, request);
    }

    // Check batch availability
    if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
      });

      if (batch && batch.status === "FULL") {
        // Batch is full, add to waitlist
      } else if (batch && batch.status === "OPEN") {
        return jsonWithRequestId({
          message: "Spots available! Direct enrollment recommended.",
          directEnrollment: true,
        }, undefined, request);
      }
    }

    const waitlist = await prisma.waitlist.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        courseSlug: data.courseSlug,
        batchId: data.batchId,
        priority: 0,
        status: "WAITING",
      },
    });

    // Send confirmation email
    sendEmail({
      to: data.email,
      subject: "You're on the Waitlist! - Bali YTTC",
      html: `
        <h2>Hi ${escapeHtml(data.name)},</h2>
        <p>You're on the waitlist for our Yoga Teacher Training course.</p>
        <p>We'll notify you as soon as a spot becomes available.</p>
        <p>In the meantime, feel free to reach out if you have questions!</p>
        <p>Namaste,<br>Bali YTTC Team</p>
      `,
    }).catch((error) => logApiError("waitlist.confirmation-email", error, request));

    return jsonWithRequestId({
      success: true,
      waitlist,
      message: "You've been added to the waitlist!",
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("waitlist.create", error, request);
    return jsonWithRequestId({ error: "Failed to join waitlist" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("waitlist.edit");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = waitlistUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, status, priority, notes } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "NOTIFIED") updateData.notifiedAt = new Date();
    if (status === "CONVERTED") updateData.convertedAt = new Date();

    const waitlist = await prisma.waitlist.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "waitlist.updated",
      entity: "waitlist",
      entityId: waitlist.id,
      newValue: waitlist,
      request,
    });

    return jsonWithRequestId({ success: true, waitlist }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("waitlist.update", error, request);
    return jsonWithRequestId({ error: "Failed to update waitlist" }, { status: 500 }, request);
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("waitlist.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = waitlistDeleteQuerySchema.safeParse({
      id: searchParams.get("id"),
    });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "id is required", details: parsedQuery.error.errors }, { status: 400 }, request);
    }
    const { id } = parsedQuery.data;

    const existing = await prisma.waitlist.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Waitlist entry not found" }, { status: 404 }, request);
    }

    await prisma.waitlist.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "waitlist.deleted",
      entity: "waitlist",
      entityId: id,
      oldValue: existing,
      request,
    });

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("waitlist.delete", error, request);
    return jsonWithRequestId({ error: "Failed to remove from waitlist" }, { status: 500 }, request);
  }
}
