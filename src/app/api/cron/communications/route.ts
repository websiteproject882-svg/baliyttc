import { CommunicationCampaign } from "@prisma/client";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { runCommunicationCampaign } from "@/lib/communications";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const cronSchema = z.object({
  campaign: z.nativeEnum(CommunicationCampaign).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerSecret === configuredSecret || bearerToken === configuredSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonWithRequestId({ error: "Unauthorized" }, { status: 401 }, request);
  }

  try {
    const payload = cronSchema.parse(await request.json().catch(() => ({})));
    const campaigns = payload.campaign
      ? [payload.campaign]
      : ["PAYMENT_REMINDER", "PREPARATION_REMINDER", "REVIEW_REQUEST"] satisfies CommunicationCampaign[];

    const results = [];
    for (const campaign of campaigns) {
      results.push(await runCommunicationCampaign({ campaign, limit: payload.limit }));
    }

    return jsonWithRequestId({
      success: true,
      executedAt: new Date().toISOString(),
      results,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("cron.communications", error, request);
    return jsonWithRequestId({ error: "Failed to execute communication cron" }, { status: 500 }, request);
  }
}
