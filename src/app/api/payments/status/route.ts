import { NextRequest } from "next/server";
import { jsonWithRequestId } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function configured(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export async function GET(request: NextRequest) {
  const settings = await getSiteSettings();
  const razorpayEnvReady = configured(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"]);
  const paypalEnvReady = configured(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "NEXT_PUBLIC_PAYPAL_CLIENT_ID"]);

  return jsonWithRequestId(
    {
      paymentSettings: settings.payments,
      providers: {
        razorpay: {
          configured: settings.payments.razorpayEnabled && razorpayEnvReady,
          enabled: settings.payments.razorpayEnabled,
          envReady: razorpayEnvReady,
          label: "Razorpay",
          unavailableReason: !settings.payments.razorpayEnabled
            ? "Razorpay is disabled by admin."
            : "Client Razorpay keys are pending.",
        },
        paypal: {
          configured: settings.payments.paypalEnabled && paypalEnvReady,
          enabled: settings.payments.paypalEnabled,
          envReady: paypalEnvReady,
          label: "PayPal",
          unavailableReason: !settings.payments.paypalEnabled
            ? "PayPal is disabled by admin."
            : "Client PayPal keys are pending.",
        },
        bankTransfer: {
          configured: settings.payments.bankTransferEnabled,
          enabled: settings.payments.bankTransferEnabled,
          envReady: true,
          label: "Bank Transfer",
          unavailableReason: settings.payments.bankTransferEnabled ? null : "Bank transfer is disabled by admin.",
        },
      },
    },
    undefined,
    request,
  );
}
