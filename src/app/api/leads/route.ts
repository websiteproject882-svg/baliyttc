import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { applyDeprecationHeaders, getClientIp, jsonWithRequestId, LEGACY_API_SUNSET, logApiError, logLegacyRouteAccess, rateLimit } from "@/lib/security";

// Mixed route: public POST stays valid for website lead capture.
// GET/PATCH management behavior is legacy compatibility and should be removed
// after the 2026-08-31 sunset in favor of /api/admin/leads.

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().default("website"),
  course: z.string().optional(),
  message: z.string().optional(),
});

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

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("leads.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

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

    const body = await request.json();
    const data = leadSchema.parse(body);

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

    return withLeadsDeprecation(request, jsonWithRequestId({ success: true, lead }, undefined, request));
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
    const body = await request.json();
    const { id, ...data } = body;

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Lead not found" }, { status: 404 }, request);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
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
    logApiError("leads.update", error, request);
    return jsonWithRequestId({ error: "Failed to update lead" }, { status: 500 }, request);
  }
}
