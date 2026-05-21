import { CommunicationCampaign } from "@prisma/client";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { getCommunicationDashboardData, runCommunicationCampaign } from "@/lib/communications";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  campaign: z.nativeEnum(CommunicationCampaign),
  recipientKeys: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function GET() {
  const { response } = await requirePermission("communications.view");
  if (response) {
    return response;
  }

  const data = await getCommunicationDashboardData();

  return NextResponse.json({
    queues: data.queues,
    logs: data.recentLogs,
  });
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

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST admin communications error:", error);
    return NextResponse.json({ error: "Failed to run communication campaign" }, { status: 500 });
  }
}
