import { NextRequest } from "next/server";
import { ResourceAudience, ResourceType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

function isSafeResourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return url.startsWith("/");
  }
}

const resourceSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional().nullable(),
  url: z.string().min(1).refine(isSafeResourceUrl, "URL must be http(s) or a relative path"),
  type: z.nativeEnum(ResourceType),
  audience: z.nativeEnum(ResourceAudience),
  taskKey: z.string().max(100).optional().nullable(),
  order: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

const updateSchema = resourceSchema.extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("prearrival.view");
  if (response) {
    return response;
  }

  try {
    const resources = await prisma.preArrivalResource.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return jsonWithRequestId({ resources }, undefined, request);
  } catch (error) {
    logApiError("admin.prearrival_resources.list", error, request);
    return jsonWithRequestId({ error: "Failed to load resources" }, { status: 500 }, request);
  }
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

    return jsonWithRequestId({ success: true, resource }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.prearrival_resources.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create resource" }, { status: 500 }, request);
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
      return jsonWithRequestId({ error: "Resource not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true, resource }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.prearrival_resources.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update resource" }, { status: 500 }, request);
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
    return jsonWithRequestId({ error: "Resource id is required" }, { status: 400 }, request);
  }

  try {
    const existing = await prisma.preArrivalResource.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Resource not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.prearrival_resources.delete", error, request, { resourceId: id, userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete resource" }, { status: 500 }, request);
  }
}
