import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { sendEmail } from "@/lib/resend";
import { createRateLimitResponse, getClientIp, rateLimit } from "@/lib/security";

const waitlistSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  courseSlug: z.string(),
  batchId: z.string().optional(),
  priority: z.number().default(0),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("waitlist.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const status = searchParams.get("status");
    const courseSlug = searchParams.get("course");

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

    return NextResponse.json({
      waitlist,
      stats: { total, waiting, notified, converted },
    });
  } catch (error) {
    console.error("GET waitlist error:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
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
      return createRateLimitResponse("Too many waitlist attempts. Try again later.", Math.ceil((limit.resetAt - Date.now()) / 1000));
    }

    const body = await request.json();
    const data = waitlistSchema.parse(body);

    // Check if already on waitlist
    const existing = await prisma.waitlist.findFirst({
      where: {
        email: data.email,
        courseSlug: data.courseSlug,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        error: "You're already on the waitlist for this course",
        waitlist: existing,
      });
    }

    // Check batch availability
    if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
      });

      if (batch && batch.status === "FULL") {
        // Batch is full, add to waitlist
      } else if (batch && batch.status === "OPEN") {
        return NextResponse.json({
          message: "Spots available! Direct enrollment recommended.",
          directEnrollment: true,
        });
      }
    }

    const waitlist = await prisma.waitlist.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        courseSlug: data.courseSlug,
        batchId: data.batchId,
        priority: data.priority,
        status: "WAITING",
      },
    });

    // Send confirmation email
    sendEmail({
      to: data.email,
      subject: "You're on the Waitlist! - Bali YTTC",
      html: `
        <h2>Hi ${data.name},</h2>
        <p>You're on the waitlist for our Yoga Teacher Training course.</p>
        <p>We'll notify you as soon as a spot becomes available.</p>
        <p>In the meantime, feel free to reach out if you have questions!</p>
        <p>Namaste,<br>Bali YTTC Team</p>
      `,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      waitlist,
      message: "You've been added to the waitlist!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST waitlist error:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
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
    const body = await request.json();
    const { id, status, priority, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, waitlist });
  } catch (error) {
    console.error("PATCH waitlist error:", error);
    return NextResponse.json({ error: "Failed to update waitlist" }, { status: 500 });
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.waitlist.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE waitlist error:", error);
    return NextResponse.json({ error: "Failed to remove from waitlist" }, { status: 500 });
  }
}
