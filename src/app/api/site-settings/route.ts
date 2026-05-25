import { NextRequest } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSiteSettings();

    return jsonWithRequestId(
      {
        settings: {
          general: settings.general,
          reviews: settings.reviews,
          assets: settings.assets,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      },
      request,
    );
  } catch (error) {
    logApiError("siteSettings.public", error, request);
    return jsonWithRequestId({ error: "Failed to fetch site settings" }, { status: 500 }, request);
  }
}
