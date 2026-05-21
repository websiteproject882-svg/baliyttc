export type PayPalEnvironment = "sandbox" | "live";

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function getPayPalEnvironment(): PayPalEnvironment {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

export function getPayPalBaseUrl(): string {
  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured");
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("PayPal token response missing access_token");
  }

  return data.access_token;
}

export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  enrollmentId?: string;
  courseName: string;
  paymentType: string;
  email?: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `baliyttc-${params.enrollmentId || Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.enrollmentId || undefined,
          description: `${params.paymentType === "deposit" ? "Deposit" : "Full Payment"} for ${params.courseName}`,
          custom_id: params.enrollmentId || undefined,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          email_address: params.email,
          experience_context: {
            user_action: "PAY_NOW",
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal order request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data as { id: string; status: string; links?: Array<{ href: string; rel: string; method: string }> };
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `baliyttc-capture-${orderId}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal capture request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data as {
    id: string;
    status: string;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id: string; status: string }> };
    }>;
  };
}

export async function refundPayPalCapture(params: {
  captureId: string;
  amount?: number;
  currency?: string;
  note?: string;
}) {
  const accessToken = await getAccessToken();
  const body = params.amount && params.currency
    ? {
        amount: {
          value: params.amount.toFixed(2),
          currency_code: params.currency.toUpperCase(),
        },
        note_to_payer: params.note,
      }
    : { note_to_payer: params.note };

  const response = await fetch(`${getPayPalBaseUrl()}/v2/payments/captures/${params.captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `baliyttc-refund-${params.captureId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal refund request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function verifyPayPalWebhook(headers: Headers, event: unknown): Promise<boolean> {
  if (!process.env.PAYPAL_WEBHOOK_ID || !isPayPalConfigured()) {
    return false;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
