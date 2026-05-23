import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const moduleProgressSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
});
const moduleParamsSchema = z.object({
  moduleId: z.string().trim().min(1).max(120),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { moduleId: string } },
) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, student, response } = await requireStudentUser({ minimumAccess: "FULL" });
  if (!user || !student || response) {
    return response;
  }

  try {
    const parsedParams = moduleParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return jsonWithRequestId({ error: "Invalid module id" }, { status: 400 }, request);
    }

    const rawPayload = await request.json().catch(() => null);
    const result = moduleProgressSchema.safeParse(rawPayload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const payload = result.data;

    const currentStudent = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        batchId: true,
        enrollments: {
          where: { paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { batchId: true },
        },
      },
    });

    const activeBatchId = currentStudent?.batchId || currentStudent?.enrollments[0]?.batchId || null;
    const activeBatch = activeBatchId
      ? await prisma.batch.findUnique({
          where: { id: activeBatchId },
          select: { courseId: true },
        })
      : null;
    const courseId = activeBatch?.courseId || null;

    if (!courseId) {
      return jsonWithRequestId({ error: "Student batch is not assigned" }, { status: 400 }, request);
    }

    const module = await prisma.module.findFirst({
      where: {
        id: parsedParams.data.moduleId,
        courseId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!module) {
      return jsonWithRequestId({ error: "Module not found" }, { status: 404 }, request);
    }

    const existing = await prisma.moduleProgress.findUnique({
      where: {
        studentId_moduleId: {
          studentId: student.id,
          moduleId: module.id,
        },
      },
      select: {
        id: true,
        completed: true,
        completedAt: true,
        notes: true,
      },
    });

    const updated = await prisma.moduleProgress.upsert({
      where: {
        studentId_moduleId: {
          studentId: student.id,
          moduleId: module.id,
        },
      },
      update: {
        moduleTitle: module.title,
        completed: payload.completed ?? existing?.completed ?? false,
        completedAt:
          payload.completed === undefined
            ? existing?.completedAt ?? null
            : payload.completed
              ? new Date()
              : null,
        notes: payload.notes ?? existing?.notes ?? null,
      },
      create: {
        studentId: student.id,
        moduleId: module.id,
        moduleTitle: module.title,
        completed: payload.completed ?? false,
        completedAt: payload.completed ? new Date() : null,
        notes: payload.notes ?? null,
      },
      select: {
        id: true,
        moduleId: true,
        moduleTitle: true,
        completed: true,
        completedAt: true,
        notes: true,
      },
    });

    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        hours: true,
      },
    });

    const progressRows = await prisma.moduleProgress.findMany({
      where: { studentId: student.id, completed: true },
      select: { moduleId: true },
    });

    const completedSet = new Set(progressRows.map((row) => row.moduleId));
    const completedHours = modules.reduce((sum, item) => {
      if (!completedSet.has(item.id)) {
        return sum;
      }
      return sum + (item.hours ?? 0);
    }, 0);

    await prisma.student.update({
      where: { id: student.id },
      data: {
        completedHours,
        modulesCompleted: Array.from(completedSet),
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.module_progress_updated",
      entity: "module_progress",
      entityId: updated.id,
      oldValue: existing || {},
      newValue: updated,
      request,
    });

    return jsonWithRequestId({ success: true, progress: updated, completedHours }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.modules.progress", error, request, { moduleId: params.moduleId });
    return jsonWithRequestId({ error: "Failed to update module progress" }, { status: 500 }, request);
  }
}
