import { CommunicationCampaign } from "@prisma/client";
import { z } from "zod";
import { NextRequest } from "next/server";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { getCommunicationDashboardData, runCommunicationCampaign } from "@/lib/communications";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  campaign: z.nativeEnum(CommunicationCampaign),
  recipientKeys: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("communications.view");
  if (response) {
    return response;
  }

  try {
    const data = await getCommunicationDashboardData();

    return jsonWithRequestId({
      queues: data.queues,
      logs: data.recentLogs,
    }, undefined, request);
  } catch (error) {
    logApiError("admin.communications.dashboard", error, request);
    return jsonWithRequestId({ error: "Failed to load communications" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("communications.send");
  if (!user || response) {
    return response;
  }

  try {
    const payload = sendSchema.parse(await request.json());
    const result = await runCommunicationCampaign(payload);

    await writeAuditLog({
      actorUserId: user.id,
      action: "communications.run",
      entity: "communication_campaign",
      entityId: payload.campaign,
      newValue: result,
      request,
    });

    return jsonWithRequestId({ success: true, ...result }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.communications.run", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to run communication campaign" }, { status: 500 }, request);
  }
}
