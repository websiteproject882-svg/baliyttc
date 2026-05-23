import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { getCommunicationDashboardData, runCommunicationCampaign } from "@/lib/communications";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "abandoned_enrollment_settings";

const settingsSchema = z.object({
  enabled: z.boolean(),
  reminder1Hours: z.coerce.number().int().min(1).max(168),
  reminder2Hours: z.coerce.number().int().min(1).max(336),
  reminder3Days: z.coerce.number().int().min(1).max(60),
  emailTemplates: z.object({
    reminder1: z.string().min(10).max(2000),
    reminder2: z.string().min(10).max(2000),
    reminder3: z.string().min(10).max(2000),
  }),
});

const reminderRequestSchema = z.object({ key: z.string().optional() });

const defaultSettings = {
  enabled: false,
  reminder1Hours: 1,
  reminder2Hours: 24,
  reminder3Days: 3,
  emailTemplates: {
    reminder1: "Hey {{name}}! You started enrolling for {{course}} but did not finish. Complete your enrollment here: {{link}}",
    reminder2: "Hi {{name}}, your {{course}} spot is waiting. Complete your enrollment here: {{link}}",
    reminder3: "Hi {{name}}, there is still time to join {{course}}. Limited spots available: {{link}}",
  },
};

async function getSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
  const parsed = settingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultSettings;
}

async function readJsonBody(request: NextRequest, emptyFallback: unknown) {
  const text = await request.text();
  if (!text.trim()) {
    return { ok: true as const, data: emptyFallback };
  }

  try {
    return { ok: true as const, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false as const };
  }
}

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("communications.view");
  if (response) return response;

  try {
    const [{ queues, recentLogs }, settings] = await Promise.all([
      getCommunicationDashboardData(),
      getSettings(),
    ]);

    const abandonedList = queues.ABANDONED_ENROLLMENT.map((item) => {
      const reminderCount = recentLogs.filter((log) => {
        const metadata = log.metadata as { enrollmentId?: string } | null;
        return log.campaign === "ABANDONED_ENROLLMENT" && metadata?.enrollmentId === item.enrollmentId;
      }).length;

      return {
        id: item.key,
        enrollmentId: item.enrollmentId,
        name: item.name,
        email: item.email,
        courseSlug: item.courseName,
        lastActivity: item.batchStartDate || new Date().toISOString(),
        remindersSent: reminderCount,
        status: "pending",
        key: item.key,
        daysUntilStart: item.daysUntilStart,
      };
    });

    return jsonWithRequestId({ settings, abandoned: abandonedList }, undefined, request);
  } catch (error) {
    logApiError("admin.abandoned.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch abandoned enrollments" }, { status: 500 }, request);
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("communications.send");
  if (!user || response) return response;

  try {
    const body = await readJsonBody(request, null);
    const parsed = body.ok ? settingsSchema.safeParse(body.data) : null;
    if (!parsed?.success) {
      return jsonWithRequestId(
        { error: "Validation failed", details: parsed?.error.errors ?? [] },
        { status: 400 },
        request,
      );
    }

    const settings = parsed.data;
    const saved = await prisma.siteSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: settings },
      update: { value: settings },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "abandoned.settings_updated",
      entity: "site_settings",
      entityId: SETTINGS_KEY,
      newValue: settings,
      request,
    });

    return jsonWithRequestId({ success: true, settings: saved.value }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.abandoned.settings", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to save abandoned settings" }, { status: 500 }, request);
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const { user, response } = await requirePermission("communications.send");
  if (!user || response) return response;

  try {
    const body = await readJsonBody(request, {});
    const parsed = body.ok ? reminderRequestSchema.safeParse(body.data) : null;
    if (!parsed?.success) {
      return jsonWithRequestId(
        { error: "Validation failed", details: parsed?.error.errors ?? [] },
        { status: 400 },
        request,
      );
    }

    const payload = parsed.data;
    const result = await runCommunicationCampaign({
      campaign: "ABANDONED_ENROLLMENT",
      recipientKeys: payload.key ? [payload.key] : undefined,
      limit: payload.key ? undefined : 25,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "abandoned.reminder_sent",
      entity: "communication_campaign",
      entityId: payload.key || "ABANDONED_ENROLLMENT",
      newValue: result,
      request,
    });

    return jsonWithRequestId({ success: true, result }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.abandoned.send", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to send abandoned reminder" }, { status: 500 }, request);
  }
}
