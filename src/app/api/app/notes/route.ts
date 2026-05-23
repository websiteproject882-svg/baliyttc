import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSameOrigin, requireStudentUser, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const notesSchema = z.object({
  personalNotes: z.string().max(10000),
});

export async function GET(request: NextRequest) {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  const current = await prisma.student.findUnique({
    where: { id: student.id },
    select: { personalNotes: true },
  });

  return jsonWithRequestId({ personalNotes: current?.personalNotes || "" }, undefined, request);
}

export async function PATCH(request: NextRequest) {
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
    const result = notesSchema.safeParse(payload);
    if (!result.success) {
      return jsonWithRequestId({ error: "Validation failed", details: result.error.errors }, { status: 400 }, request);
    }

    const data = result.data;
    const existing = await prisma.student.findUnique({
      where: { id: student.id },
      select: { personalNotes: true },
    });

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { personalNotes: data.personalNotes },
      select: { personalNotes: true },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "student.notes_updated",
      entity: "student",
      entityId: student.id,
      oldValue: { personalNotes: existing?.personalNotes || "" },
      newValue: { personalNotes: updated.personalNotes || "" },
      request,
    });

    return jsonWithRequestId({ success: true, personalNotes: updated.personalNotes || "" }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("app.notes", error, request, { studentId: student.id });
    return jsonWithRequestId({ error: "Failed to save notes" }, { status: 500 }, request);
  }
}
