import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const taskUpdateSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskKey: string } },
) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!user || !student || response) {
    return response;
  }

  try {
    const payload = await request.json().catch(() => null);
    const result = taskUpdateSchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const { completed } = result.data;
    const existing = await prisma.taskProgress.findUnique({
      where: {
        studentId_taskKey: {
          studentId: student.id,
          taskKey: params.taskKey,
        },
      },
    });

    if (!existing) {
      return jsonWithRequestId({ error: "Task not found" }, { status: 404 }, request);
    }

    const updated = await prisma.taskProgress.update({
      where: {
        studentId_taskKey: {
          studentId: student.id,
          taskKey: params.taskKey,
        },
      },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.task_updated",
      entity: "task_progress",
      entityId: updated.id,
      oldValue: { completed: existing.completed },
      newValue: { completed: updated.completed },
      request,
    });

    return jsonWithRequestId({ success: true, task: updated }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.tasks.progress", error, request, { taskKey: params.taskKey });
    return jsonWithRequestId({ error: "Failed to update task" }, { status: 500 }, request);
  }
}
