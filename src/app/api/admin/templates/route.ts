import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, writeAuditLog } from "@/lib/authz";

// Email templates are stored in the database for admin editing
// This API provides CRUD operations for templates

export async function GET() {
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

      return NextResponse.json({
        templates: defaultTemplates.map((t, i) => ({
          id: t.slug,
          ...t,
          subject: `${t.name} - Bali YTTC`,
          content: "",
          lastUpdated: new Date().toISOString(),
          variables: [],
        })),
      });
    }

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.title,
        subject: t.metaTitle || t.title,
        content: t.content,
        lastUpdated: t.updatedAt.toISOString(),
        variables: extractVariables(t.content),
      })),
    });
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  try {
    const body = await request.json();
    const { id, name, subject, content } = body;

    const template = await prisma.blogPost.upsert({
      where: { id: id || `template_${Date.now()}` },
      create: {
        id: id || `template_${Date.now()}`,
        title: name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        content,
        excerpt: subject,
        category: "email_template",
        status: "DRAFT",
        author: user!.email,
        metaTitle: subject,
      },
      update: {
        title: name,
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

    return NextResponse.json({
      template: {
        id: template.id,
        name,
        subject,
        content,
        lastUpdated: template.updatedAt.toISOString(),
        variables: extractVariables(content),
      },
    });
  } catch (error) {
    console.error("Template update error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ""));
  return Array.from(new Set(vars));
}
