import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { sendEmail } from "@/lib/resend";
import { jsonWithRequestId, logApiError } from "@/lib/security";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const providerKeys = {
  email: [
    ["RESEND_API_KEY"],
    ["GMAIL_EMAIL", "GMAIL_APP_PASSWORD"],
  ],
  whatsapp: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
} as const;

const httpsOrRelativeUrl = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "URL must use https or start with /");

const whatsappParameterSchema = z.object({
  type: z.string().trim().min(1).max(50),
  text: z.string().trim().min(1).max(500).optional(),
  image: z
    .object({
      link: httpsOrRelativeUrl.optional(),
    })
    .optional(),
});

const whatsappComponentSchema = z.object({
  type: z.enum(["header", "body", "button"]),
  parameters: z.array(whatsappParameterSchema).max(10),
});

const smokeSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("email"),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  }),
  z.object({
    provider: z.literal("whatsapp"),
    phone: z.string().trim().min(8).max(24),
    template: z.string().trim().min(1).max(100),
    language: z.string().trim().min(2).max(16).optional(),
    components: z.array(whatsappComponentSchema).max(5).optional(),
  }),
]);

function providerStatus(keys: readonly string[]) {
  const missingKeys = keys.filter((key) => !process.env[key]?.trim());
  const status =
    missingKeys.length === 0 ? "configured" : missingKeys.length === keys.length ? "missing" : "partial";

  return { status, missingKeys };
}

function alternativeProviderStatus(groups: readonly (readonly string[])[]) {
  const statuses = groups.map(providerStatus);
  const configured = statuses.find((item) => item.status === "configured");
  if (configured) return { status: "configured", missingKeys: [] };

  const partial = statuses.find((item) => item.status === "partial");
  if (partial) return { status: "partial", missingKeys: partial.missingKeys };

  return { status: "missing", missingKeys: groups.flatMap((group) => [...group]) };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown provider error";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : "***";
}

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("communications.view");
  if (response) {
    return response;
  }

  return jsonWithRequestId(
    {
      providers: Object.fromEntries(
        Object.entries(providerKeys).map(([name, keys]) => [
          name,
          Array.isArray(keys[0]) ? alternativeProviderStatus(keys as readonly (readonly string[])[]) : providerStatus(keys as readonly string[]),
        ]),
      ),
    },
    undefined,
    request,
  );
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("communications.send");
  if (!user || response) {
    return response;
  }

  try {
    const parsed = smokeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const payload = parsed.data;

    if (payload.provider === "email") {
      const result = await sendEmail({
        to: payload.email,
        subject: "Bali YTTC provider smoke test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h1 style="font-size: 20px;">Bali YTTC provider smoke test</h1>
            <p>This confirms the hosted email provider can send from the current environment.</p>
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      await writeAuditLog({
        actorUserId: user.id,
        action: "provider.smoke_test",
        entity: "email_provider",
        entityId: "email",
        newValue: {
          provider: payload.provider,
          target: maskEmail(payload.email),
          success: result.success,
          id: "id" in result ? result.id : undefined,
          demo: "demo" in result ? result.demo : undefined,
        },
        request,
      });

      if (!result.success) {
        return jsonWithRequestId(
          { success: false, provider: payload.provider, error: errorMessage(result.error) },
          { status: 502 },
          request,
        );
      }

      return jsonWithRequestId(
        {
          success: true,
          provider: payload.provider,
          target: maskEmail(payload.email),
          id: "id" in result ? result.id ?? null : null,
        },
        undefined,
        request,
      );
    }

    const result = await sendWhatsAppMessage({
      to: payload.phone,
      template: payload.template,
      language: payload.language,
      components: payload.components,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "provider.smoke_test",
      entity: "whatsapp_provider",
      entityId: payload.template,
      newValue: {
        provider: payload.provider,
        target: maskPhone(payload.phone),
        template: payload.template,
        success: result.success,
        messageId: result.messageId,
      },
      request,
    });

    if (!result.success) {
      return jsonWithRequestId(
        { success: false, provider: payload.provider, error: result.error ?? "WhatsApp smoke test failed" },
        { status: 502 },
        request,
      );
    }

    return jsonWithRequestId(
      {
        success: true,
        provider: payload.provider,
        target: maskPhone(payload.phone),
        template: payload.template,
        messageId: result.messageId ?? null,
      },
      undefined,
      request,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }

    logApiError("admin.provider-smoke", error, request);
    return jsonWithRequestId({ error: "Provider smoke test failed" }, { status: 500 }, request);
  }
}
