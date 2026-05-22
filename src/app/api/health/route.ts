import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRuntimeEnv } from "@/lib/env-validation";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const providerKeys = {
  razorpay: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
  paypal: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
  email: [
    ["RESEND_API_KEY"],
    ["GMAIL_EMAIL", "GMAIL_APP_PASSWORD"],
  ],
  whatsapp: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
};

function providerStatus(keys: string[]) {
  const configured = keys.filter((key) => !!process.env[key]?.trim()).length;
  if (configured === 0) return "missing";
  if (configured === keys.length) return "configured";
  return "partial";
}

function alternativeProviderStatus(groups: string[][]) {
  const statuses = groups.map(providerStatus);
  if (statuses.includes("configured")) return "configured";
  if (statuses.includes("partial")) return "partial";
  return "missing";
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const env = validateRuntimeEnv();
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "error";
    logApiError("health.database", error, request);
  }

  const healthy = database === "ok" && env.ok;

  return jsonWithRequestId(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks: {
        database,
        env: env.ok ? "ok" : "error",
      },
      providers: Object.fromEntries(
        Object.entries(providerKeys).map(([name, keys]) => [
          name,
          Array.isArray(keys[0]) ? alternativeProviderStatus(keys as string[][]) : providerStatus(keys as string[]),
        ]),
      ),
      warnings: env.warnings,
      errors: env.errors,
    },
    { status: healthy ? 200 : 503 },
    request,
  );
}
