import { NextRequest } from "next/server";
import { getPaymentProviderReadiness } from "@/lib/payments/readiness";
import { jsonWithRequestId } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const settings = await getSiteSettings();
  const readiness = getPaymentProviderReadiness();

  return jsonWithRequestId(
    {
      paymentSettings: settings.payments,
      providers: {
        razorpay: {
          configured: settings.payments.razorpayEnabled && readiness.razorpay.checkoutReady,
          enabled: settings.payments.razorpayEnabled,
          envReady: readiness.razorpay.envReady,
          checkoutReady: readiness.razorpay.checkoutReady,
          webhookReady: readiness.razorpay.webhookReady,
          missingEnv: readiness.razorpay.missingEnv,
          label: "Razorpay",
          unavailableReason: !settings.payments.razorpayEnabled
            ? "Razorpay is disabled by admin."
            : "Client Razorpay checkout keys are pending.",
        },
        paypal: {
          configured: settings.payments.paypalEnabled && readiness.paypal.checkoutReady,
          enabled: settings.payments.paypalEnabled,
          envReady: readiness.paypal.envReady,
          checkoutReady: readiness.paypal.checkoutReady,
          webhookReady: readiness.paypal.webhookReady,
          missingEnv: readiness.paypal.missingEnv,
          label: "PayPal",
          unavailableReason: !settings.payments.paypalEnabled
            ? "PayPal is disabled by admin."
            : "Client PayPal checkout keys are pending.",
        },
        bankTransfer: {
          configured: settings.payments.bankTransferEnabled,
          enabled: settings.payments.bankTransferEnabled,
          envReady: readiness.bankTransfer.envReady,
          checkoutReady: readiness.bankTransfer.checkoutReady,
          webhookReady: readiness.bankTransfer.webhookReady,
          missingEnv: readiness.bankTransfer.missingEnv,
          label: "Bank Transfer",
          unavailableReason: settings.payments.bankTransferEnabled ? null : "Bank transfer is disabled by admin.",
        },
      },
    },
    undefined,
    request,
  );
}
