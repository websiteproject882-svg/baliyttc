// WhatsApp Business API Integration
// Setup: https://business.whatsapp.com/

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

export interface WhatsAppMessage {
  to: string;
  template: string;
  language?: string;
  components?: WhatsAppComponent[];
}

export interface WhatsAppComponent {
  type: "header" | "body" | "button";
  parameters: { type: string; text?: string; image?: { link?: string } }[];
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

function isWhatsAppConfigured(): boolean {
  return !!PHONE_NUMBER_ID && !!ACCESS_TOKEN;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // If starts with 0, replace with country code 62 (Indonesia)
  if (digits.startsWith("0")) {
    return "62" + digits.substring(1);
  }

  // If doesn't start with +, add it
  if (!digits.startsWith("62")) {
    return "62" + digits;
  }

  return digits;
}

export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Demo mode if not configured
  if (!isWhatsAppConfigured()) {
    console.log("[WhatsApp Demo] Would send:", {
      to: message.to,
      template: message.template,
    });
    return { success: true, messageId: "demo_" + Date.now() };
  }

  try {
    const formattedPhone = formatPhoneNumber(message.to);

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: message.template,
        language: {
          code: message.language || "en",
        },
        components: message.components || [],
      },
    };

    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || "Failed to send WhatsApp message";
      throw new Error(errorMessage);
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("WhatsApp error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send message" };
  }
}

// Template messages
export async function sendEnrollmentConfirmationWhatsApp(data: {
  name: string;
  phone: string;
  course: string;
  batch: string;
}) {
  return sendWhatsAppMessage({
    to: data.phone,
    template: "enrollment_confirmation",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.name },
          { type: "text", text: data.course },
          { type: "text", text: data.batch },
        ],
      },
    ],
  });
}

export async function sendPaymentConfirmationWhatsApp(data: {
  name: string;
  phone: string;
  amount: string;
  course: string;
}) {
  return sendWhatsAppMessage({
    to: data.phone,
    template: "payment_confirmed",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.name },
          { type: "text", text: data.amount },
          { type: "text", text: data.course },
        ],
      },
    ],
  });
}

export async function sendBatchReminderWhatsApp(data: {
  name: string;
  phone: string;
  daysUntil: string;
  batch: string;
}) {
  return sendWhatsAppMessage({
    to: data.phone,
    template: "batch_reminder",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.name },
          { type: "text", text: data.daysUntil },
          { type: "text", text: data.batch },
        ],
      },
    ],
  });
}

export async function sendWelcomeWhatsApp(data: {
  name: string;
  phone: string;
  course: string;
}) {
  return sendWhatsAppMessage({
    to: data.phone,
    template: "welcome_message",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.name },
          { type: "text", text: data.course },
        ],
      },
    ],
  });
}

export function sendWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

// Generate WhatsApp pre-filled message
export function generatePreFilledMessage(data: {
  name?: string;
  email?: string;
  course?: string;
  message?: string;
}): string {
  let msg = "Hi Bali YTTC!\n\n";

  if (data.name) msg += `Name: ${data.name}\n`;
  if (data.email) msg += `Email: ${data.email}\n`;
  if (data.course) msg += `Interested in: ${data.course}\n`;
  if (data.message) msg += `\n${data.message}`;

  return msg;
}
