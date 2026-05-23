import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStudentUser } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

function allowedAudiences(accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI") {
  if (accessLevel === "ALUMNI") return ["ALUMNI", "ALL_ACTIVE"];
  if (accessLevel === "FULL") return ["PRE_ARRIVAL", "FULL", "ALL_ACTIVE"];
  if (accessLevel === "PRE_ARRIVAL") return ["PRE_ARRIVAL", "ALL_ACTIVE"];
  return [];
}

function isSafeRedirectUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return url.startsWith("/");
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  try {
    const resource = await prisma.preArrivalResource.findUnique({
      where: { id: params.id },
    });

    if (!resource || !resource.isActive || !allowedAudiences(student.accessLevel).includes(resource.audience)) {
      return jsonWithRequestId({ error: "Resource not found" }, { status: 404 }, request);
    }

    if (!isSafeRedirectUrl(resource.url)) {
      return jsonWithRequestId({ error: "Resource URL is invalid" }, { status: 400 }, request);
    }

    return NextResponse.redirect(new URL(resource.url, request.url));
  } catch (error) {
    logApiError("app.resources.redirect", error, request, { resourceId: params.id, studentId: student.id });
    return jsonWithRequestId({ error: "Failed to open resource" }, { status: 500 }, request);
  }
}
