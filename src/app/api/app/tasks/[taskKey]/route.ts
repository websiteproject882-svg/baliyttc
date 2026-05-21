import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

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
    const { completed } = await request.json();
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
        completed: Boolean(completed),
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
    console.error("PATCH app task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
