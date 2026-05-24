import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { sendEmail } from "@/lib/resend";
import { applyDeprecationHeaders, getClientIp, jsonWithRequestId, LEGACY_API_SUNSET, logApiError, logLegacyRouteAccess, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// Mixed route: public POST stays valid for website lead capture.
// GET/PATCH management behavior is legacy compatibility and should be removed
// after the 2026-08-31 sunset in favor of /api/admin/leads.

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().min(1).max(80).default("website"),
  course: z.string().trim().max(160).optional(),
  message: z.string().trim().max(3000).optional(),
  website: z.string().trim().max(200).optional(),
});

const leadUpdateSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    status: z.enum(["NEW", "CONTACTED", "INTERESTED", "ENROLLED", "NOT_INTERESTED", "SPAM"]).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    assignedTo: z.string().trim().max(120).nullable().optional(),
    followUpAt: z
      .string()
      .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Invalid date")
      .nullable()
      .optional(),
  })
  .refine(
    ({ status, notes, assignedTo, followUpAt }) =>
      status !== undefined || notes !== undefined || assignedTo !== undefined || followUpAt !== undefined,
    "At least one update field is required",
  );

const leadStatuses = ["NEW", "CONTACTED", "INTERESTED", "ENROLLED", "NOT_INTERESTED", "SPAM"] as const;

const leadListQuerySchema = z.object({
  status: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  }, z.enum(leadStatuses).optional()),
});

function getPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

function withLeadsDeprecation(request: NextRequest, response: NextResponse) {
  logLegacyRouteAccess(request, {
    route: "/api/leads",
    replacement: "/api/admin/leads",
  });
  return applyDeprecationHeaders(response, {
    replacement: "/api/admin/leads",
    sunset: LEGACY_API_SUNSET,
    message: "Use /api/admin/leads for authenticated lead management. Keep /api/leads only for public lead capture.",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || "info@baliyttc.com";
}

function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function sendLeadNotification(data: z.infer<typeof leadSchema>, leadId: string, request: NextRequest) {
  const course = data.course || "General inquiry";
  const phone = data.phone || "Not provided";
  const message = data.message || "No message";

  return sendEmail({
    to: getAdminEmail(),
    subject: `New Bali YTTC Lead: ${data.name} - ${course}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <div style="background: #F04E23; padding: 22px; border-radius: 14px 14px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">New Website Lead</h1>
        </div>
        <div style="border: 1px solid #eee; border-top: 0; padding: 24px; border-radius: 0 0 14px 14px;">
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Course / date:</strong> ${escapeHtml(course)}</p>
          <p><strong>Source:</strong> ${escapeHtml(data.source)}</p>
          <div style="background: #faf8f5; padding: 16px; border-radius: 10px; margin: 18px 0;">
            <strong>Message</strong>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${escapeHtml(message)}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">Lead ID: ${escapeHtml(leadId)}</p>
          <a href="${getPublicBaseUrl()}/en/admin/leads" style="display: inline-block; background: #1f2937; color: white; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 700;">Open admin leads</a>
        </div>
      </div>
    `,
  }).catch((error) => logApiError("leads.notification-email", error, request, { leadId }));
}

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("leads.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = leadListQuerySchema.safeParse({
      status: searchParams.get("status"),
    });
    if (!parsedQuery.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsedQuery.error.errors }, { status: 400 }, request);
    }
    const { status } = parsedQuery.data;
    const page = getPositiveInt(searchParams.get("page"), 1, 10_000);
    const limit = getPositiveInt(searchParams.get("limit"), 20, 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return withLeadsDeprecation(request, jsonWithRequestId({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, undefined, request));
  } catch (error) {
    logApiError("leads.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch leads" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `public:leads:${getClientIp(request)}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: "Too many lead submissions. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;

    if (data.website) {
      return jsonWithRequestId({ success: true, lead: null }, undefined, request);
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        source: data.source,
        course: data.course,
        message: data.message,
        status: "NEW",
      },
    });

    sendLeadNotification(data, lead.id, request);

    return withLeadsDeprecation(
      request,
      jsonWithRequestId(
        {
          success: true,
          lead: {
            id: lead.id,
            status: lead.status,
          },
        },
        undefined,
        request,
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("leads.create", error, request);
    return jsonWithRequestId({ error: "Failed to create lead" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("leads.edit");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, status, notes, assignedTo, followUpAt } = parsed.data;

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Lead not found" }, { status: 404 }, request);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(followUpAt !== undefined && { followUpAt: followUpAt ? new Date(followUpAt) : null }),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "lead.updated.legacy_route",
      entity: "lead",
      entityId: lead.id,
      oldValue: existing,
      newValue: lead,
      request,
    });

    return withLeadsDeprecation(request, jsonWithRequestId({ success: true, lead }, undefined, request));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("leads.update", error, request);
    return jsonWithRequestId({ error: "Failed to update lead" }, { status: 500 }, request);
  }
}
