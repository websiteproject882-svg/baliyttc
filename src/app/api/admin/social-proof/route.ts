import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { SOCIAL_PROOF_SETTINGS_KEY, getSocialProofStats, socialProofSchema } from "@/lib/social-proof";
import { invalidateCache } from "../../../../lib/runtime-cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("social_proof.view");
  if (response) return response;

  try {
    const { stats, computedStats } = await getSocialProofStats();
    return jsonWithRequestId({ stats, computedStats }, undefined, request);
  } catch (error) {
    logApiError("admin.socialProof.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch social proof" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("social_proof.edit");
  if (response) return response;

  try {
    const parsed = socialProofSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const stats = parsed.data;
    const existing = await prisma.siteSetting.findUnique({ where: { key: SOCIAL_PROOF_SETTINGS_KEY } });
    await prisma.siteSetting.upsert({
      where: { key: SOCIAL_PROOF_SETTINGS_KEY },
      create: { key: SOCIAL_PROOF_SETTINGS_KEY, value: stats },
      update: { value: stats },
    });

    invalidateCache("social_proof_stats_cache");

    await writeAuditLog({
      actorUserId: user!.id,
      action: "social_proof.updated",
      entity: "site_settings",
      entityId: SOCIAL_PROOF_SETTINGS_KEY,
      oldValue: existing?.value,
      newValue: stats,
      request,
    });

    return jsonWithRequestId({ success: true, stats }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.socialProof.update", error, request, { userId: user!.id });
    return jsonWithRequestId({ error: "Failed to update social proof" }, { status: 500 }, request);
  }
}
