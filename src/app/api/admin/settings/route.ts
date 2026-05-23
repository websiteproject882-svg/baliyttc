import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireSuperAdmin, writeAuditLog } from "@/lib/authz";
import { getPaymentProviderReadiness } from "@/lib/payments/readiness";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getSiteSettings, saveSiteSettings, siteSettingsSchema } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function providerReadiness() {
  return getPaymentProviderReadiness();
}

export async function GET(request: NextRequest) {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  const settings = await getSiteSettings();
  return jsonWithRequestId({ settings, providers: providerReadiness() }, undefined, request);
}

export async function PATCH(request: NextRequest) {
  const originResponse = requireSameOrigin(request);
  if (originResponse) return originResponse;

  const { user, response } = await requireSuperAdmin();
  if (!user || response) return response;

  try {
    const parsed = siteSettingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId(
        { error: "Invalid settings payload", details: parsed.error.flatten() },
        { status: 400 },
        request,
      );
    }

    const before = await getSiteSettings();
    const settings = await saveSiteSettings(parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "settings.updated",
      entity: "site_settings",
      entityId: "site_settings",
      oldValue: before,
      newValue: settings,
      request,
    });

    return jsonWithRequestId({ settings, providers: providerReadiness() }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId(
        { error: "Invalid settings payload", details: error.flatten() },
        { status: 400 },
        request,
      );
    }

    logApiError("admin.settings", error, request);
    return jsonWithRequestId({ error: "Failed to save settings" }, { status: 500 }, request);
  }
}
