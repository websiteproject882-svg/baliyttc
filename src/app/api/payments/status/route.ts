import { NextRequest } from "next/server";
import { getPaymentProviderReadiness } from "@/lib/payments/readiness";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSiteSettings();
    const readiness = getPaymentProviderReadiness();
    const adminUser = await getCurrentUser("admin").catch(() => null);
    const includeDiagnostics = adminUser?.role === "SUPER_ADMIN";

    const provider = (
      key: keyof typeof readiness,
      configured: boolean,
      enabled: boolean,
      label: string,
      unavailableReason: string | null,
    ) => ({
      configured,
      enabled,
      label,
      unavailableReason,
      ...(includeDiagnostics
        ? {
            diagnostics: {
              envReady: readiness[key].envReady,
              checkoutReady: readiness[key].checkoutReady,
              webhookReady: readiness[key].webhookReady,
              missingEnv: readiness[key].missingEnv,
              requiredEnv: readiness[key].requiredEnv,
            },
          }
        : {}),
    });

    return jsonWithRequestId(
      {
        paymentSettings: settings.payments,
        providers: {
          razorpay: provider(
            "razorpay",
            settings.payments.razorpayEnabled && readiness.razorpay.checkoutReady,
            settings.payments.razorpayEnabled,
            "Razorpay",
            !settings.payments.razorpayEnabled
              ? "Razorpay is disabled by admin."
              : "Client Razorpay checkout keys are pending.",
          ),
          paypal: provider(
            "paypal",
            settings.payments.paypalEnabled && readiness.paypal.checkoutReady,
            settings.payments.paypalEnabled,
            "PayPal",
            !settings.payments.paypalEnabled
              ? "PayPal is disabled by admin."
              : "Client PayPal checkout keys are pending.",
          ),
          bankTransfer: provider(
            "bankTransfer",
            settings.payments.bankTransferEnabled,
            settings.payments.bankTransferEnabled,
            "Bank Transfer",
            settings.payments.bankTransferEnabled ? null : "Bank transfer is disabled by admin.",
          ),
        },
      },
      undefined,
      request,
    );
  } catch (error) {
    logApiError("payments.status", error, request);
    return jsonWithRequestId({ error: "Failed to load payment status" }, { status: 500 }, request);
  }
}
