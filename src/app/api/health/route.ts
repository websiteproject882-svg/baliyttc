import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";
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
  const adminUser = await getCurrentUser("admin").catch(() => null);
  const canSeeDiagnostics = adminUser?.role === "SUPER_ADMIN";
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "error";
    logApiError("health.database", error, request);
  }

  const healthy = database === "ok" && env.ok;

  const baseResponse = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };

  return jsonWithRequestId(
    canSeeDiagnostics
      ? {
          ...baseResponse,
      runtime: {
        nodeEnv: process.env.NODE_ENV || "development",
        commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || null,
        region: process.env.VERCEL_REGION || process.env.RAILWAY_REGION || null,
      },
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
        }
      : baseResponse,
    { status: healthy ? 200 : 503 },
    request,
  );
}
