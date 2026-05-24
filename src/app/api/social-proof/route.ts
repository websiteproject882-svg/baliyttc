import { NextRequest } from "next/server";
import { getSocialProofStats } from "@/lib/social-proof";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { stats } = await getSocialProofStats();
    return jsonWithRequestId({ stats }, undefined, request);
  } catch (error) {
    logApiError("socialProof.public", error, request);
    return jsonWithRequestId({ error: "Failed to fetch social proof" }, { status: 500 }, request);
  }
}
