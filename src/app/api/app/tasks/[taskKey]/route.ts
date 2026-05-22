import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";

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
    const { completed } = taskUpdateSchema.parse(await request.json());
    const existing = await prisma.taskProgress.findUnique({
      where: {
        studentId_taskKey: {
          studentId: student.id,
          taskKey: params.taskKey,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH app task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
