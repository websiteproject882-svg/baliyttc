import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStudentUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

function allowedAudiences(accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI") {
  if (accessLevel === "ALUMNI") return ["ALUMNI", "ALL_ACTIVE"];
  if (accessLevel === "FULL") return ["PRE_ARRIVAL", "FULL", "ALL_ACTIVE"];
  if (accessLevel === "PRE_ARRIVAL") return ["PRE_ARRIVAL", "ALL_ACTIVE"];
  return [];
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { student, response } = await requireStudentUser({ minimumAccess: "PRE_ARRIVAL" });
  if (!student || response) {
    return response;
  }

  const resource = await prisma.preArrivalResource.findUnique({
    where: { id: params.id },
  });

  if (!resource || !resource.isActive || !allowedAudiences(student.accessLevel).includes(resource.audience)) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.redirect(resource.url);
}
