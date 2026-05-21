import { NextRequest, NextResponse } from "next/server";
import { ResourceAudience, ResourceType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const resourceSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional().nullable(),
  url: z.string().url(),
  type: z.nativeEnum(ResourceType),
  audience: z.nativeEnum(ResourceAudience),
  taskKey: z.string().max(100).optional().nullable(),
  order: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

const updateSchema = resourceSchema.extend({
  id: z.string(),
});

export async function GET() {
  const { response } = await requirePermission("prearrival.view");
  if (response) {
    return response;
  }

  const resources = await prisma.preArrivalResource.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ resources });
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("prearrival.edit");
  if (!user || response) {
    return response;
  }

  try {
    const data = resourceSchema.parse(await request.json());
    const resource = await prisma.preArrivalResource.create({
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url,
        type: data.type,
        audience: data.audience,
        taskKey: data.taskKey || null,
        order: data.order,
        isActive: data.isActive,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "prearrival_resource.created",
      entity: "prearrival_resource",
      entityId: resource.id,
      newValue: resource,
      request,
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST prearrival resources error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("prearrival.edit");
  if (!user || response) {
    return response;
  }

  try {
    const data = updateSchema.parse(await request.json());
    const existing = await prisma.preArrivalResource.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const resource = await prisma.preArrivalResource.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url,
        type: data.type,
        audience: data.audience,
        taskKey: data.taskKey || null,
        order: data.order,
        isActive: data.isActive,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "prearrival_resource.updated",
      entity: "prearrival_resource",
      entityId: resource.id,
      oldValue: existing,
      newValue: resource,
      request,
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH prearrival resources error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("prearrival.edit");
  if (!user || response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Resource id is required" }, { status: 400 });
  }

  const existing = await prisma.preArrivalResource.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  await prisma.preArrivalResource.delete({ where: { id } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "prearrival_resource.deleted",
    entity: "prearrival_resource",
    entityId: id,
    oldValue: existing,
    request,
  });

  return NextResponse.json({ success: true });
}
