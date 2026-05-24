import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

// Email templates are stored in the database for admin editing
// This API provides CRUD operations for templates

export const dynamic = "force-dynamic";

const DEFAULT_TEMPLATE_UPDATED_AT = "1970-01-01T00:00:00.000Z";

const templateSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  type: z.enum(["enrollment", "prearrival", "reminder", "certificate", "review", "earlybird", "visa"]).optional(),
  name: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(240),
  content: z.string().max(50000),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("templates.view");
  if (response) return response;

  try {
    // Get templates from blog posts with template type
    const templates = await prisma.blogPost.findMany({
      where: {
        category: "email_template",
      },
      orderBy: { createdAt: "asc" },
    });

    // Default templates if none exist
    if (templates.length === 0) {
      const defaultTemplates = [
        { slug: "enrollment", name: "Enrollment Confirmation", type: "enrollment" },
        { slug: "prearrival", name: "Pre-Arrival", type: "prearrival" },
        { slug: "reminder", name: "Payment Reminder", type: "reminder" },
        { slug: "certificate", name: "Certificate", type: "certificate" },
        { slug: "review", name: "Review Request", type: "review" },
        { slug: "earlybird", name: "Early Bird", type: "earlybird" },
        { slug: "visa", name: "Visa Information", type: "visa" },
      ];

      return jsonWithRequestId({
        templates: defaultTemplates.map((t) => ({
          id: t.slug,
          ...t,
          subject: `${t.name} - Bali YTTC`,
          content: "",
          lastUpdated: DEFAULT_TEMPLATE_UPDATED_AT,
          variables: [],
        })),
      }, undefined, request);
    }

    return jsonWithRequestId({
      templates: templates.map(t => ({
        id: t.id,
        name: t.title,
        type: t.slug,
        subject: t.metaTitle || t.title,
        content: t.content,
        lastUpdated: t.updatedAt.toISOString(),
        variables: extractVariables(t.content),
      })),
    }, undefined, request);
  } catch (error) {
    logApiError("admin.templates.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch templates" }, { status: 500 }, request);
  }
}

export async function PUT(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("templates.edit");
  if (response) return response;

  try {
    const parsed = templateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const { id, name, subject, content } = parsed.data;
    const type = parsed.data.type || id || name.toLowerCase().replace(/\s+/g, "-");
    const templateId = id || type;

    const template = await prisma.blogPost.upsert({
      where: { id: templateId },
      create: {
        id: templateId,
        title: name,
        slug: type,
        content,
        excerpt: subject,
        category: "email_template",
        status: "DRAFT",
        author: user!.email,
        metaTitle: subject,
      },
      update: {
        title: name,
        slug: type,
        content,
        metaTitle: subject,
        updatedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorUserId: user!.id,
      action: "template.updated",
      entity: "blogPost",
      entityId: template.id,
      newValue: { name, subject },
      request,
    });

    return jsonWithRequestId({
      template: {
        id: template.id,
        name,
        type,
        subject,
        content,
        lastUpdated: template.updatedAt.toISOString(),
        variables: extractVariables(content),
      },
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.templates.update", error, request, { userId: user?.id });
    return jsonWithRequestId({ error: "Failed to update template" }, { status: 500 }, request);
  }
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ""));
  return Array.from(new Set(vars));
}
