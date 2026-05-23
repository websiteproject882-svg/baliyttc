import { CommunicationCampaign } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { NextRequest } from "next/server";
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
  return safeSecretEquals(headerSecret, configuredSecret) || safeSecretEquals(bearerToken, configuredSecret);
}

function safeSecretEquals(received: string | null | undefined, expected: string) {
  if (!received || received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function runCron(request: NextRequest, payload: unknown) {
  if (!isAuthorized(request)) {
    return jsonWithRequestId({ error: "Unauthorized" }, { status: 401 }, request);
  }

  try {
    const data = cronSchema.parse(payload);
    const campaigns = data.campaign
      ? [data.campaign]
      : ["PAYMENT_REMINDER", "PREPARATION_REMINDER", "REVIEW_REQUEST"] satisfies CommunicationCampaign[];

    const results = [];
    for (const campaign of campaigns) {
      results.push(await runCommunicationCampaign({ campaign, limit: data.limit }));
    }

    return jsonWithRequestId({
      success: true,
      executedAt: new Date().toISOString(),
      results,
    }, { headers: { "Cache-Control": "no-store" } }, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("cron.communications", error, request);
    return jsonWithRequestId({ error: "Failed to execute communication cron" }, { status: 500 }, request);
  }
}

async function readCronPayload(request: NextRequest) {
  const text = await request.text();
  if (!text.trim()) {
    return { ok: true as const, payload: {} };
  }

  try {
    return { ok: true as const, payload: JSON.parse(text) as unknown };
  } catch {
    return { ok: false as const };
  }
}

export async function GET(request: NextRequest) {
  return runCron(request, {});
}

export async function POST(request: NextRequest) {
  const body = await readCronPayload(request);
  if (!body.ok) {
    return jsonWithRequestId({ error: "Validation failed", details: [] }, { status: 400 }, request);
  }

  return runCron(request, body.payload);
}
