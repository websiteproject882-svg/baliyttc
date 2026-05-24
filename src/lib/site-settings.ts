import { z } from "zod";
import prisma from "@/lib/prisma";

export const SITE_SETTINGS_KEY = "site_settings";
export const PAYMENT_PROVIDERS = ["paypal", "razorpay", "bank_transfer"] as const;
type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

const emptyString = z.literal("");
const httpsUrl = z.string().trim().url().refine((value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, {
  message: "URL must use https",
});
const httpsOrRelativeUrl = z.string().trim().refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "URL must use https or start with /");

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanHttpsUrl(value: unknown) {
  if (value === "") return "";
  if (typeof value !== "string") return undefined;
  const result = httpsUrl.safeParse(value);
  return result.success ? result.data : "";
}

function cleanHttpsOrRelativeUrl(value: unknown) {
  if (value === "") return "";
  if (typeof value !== "string") return undefined;
  const result = httpsOrRelativeUrl.safeParse(value);
  return result.success ? result.data : "";
}

export function normalizePaymentProviderOrder(value: unknown): PaymentProvider[] {
  const validProviders = new Set<PaymentProvider>(PAYMENT_PROVIDERS);
  const providers = Array.isArray(value) ? value : [];
  const normalized = providers.filter(
    (provider): provider is PaymentProvider =>
      typeof provider === "string" && validProviders.has(provider as PaymentProvider),
  );
  const uniqueProviders = Array.from(new Set(normalized));

  return [
    ...uniqueProviders,
    ...PAYMENT_PROVIDERS.filter((provider) => !uniqueProviders.includes(provider)),
  ];
}

export const siteSettingsSchema = z.object({
  general: z.object({
    schoolName: z.string().trim().min(1).max(120),
    tagline: z.string().trim().max(180),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    phone: z.string().trim().max(60),
    address: z.string().trim().max(300),
    timezone: z.string().trim().min(1).max(80),
  }),
  payments: z.object({
    paypalEnabled: z.boolean(),
    razorpayEnabled: z.boolean(),
    bankTransferEnabled: z.boolean(),
    depositEnabled: z.boolean(),
    fullPaymentEnabled: z.boolean(),
    displayCurrencyPrimary: z.enum(["EUR", "USD"]),
    displayCurrencySecondary: z.enum(["EUR", "USD", "INR"]),
    razorpayCurrency: z.literal("INR"),
    eurToInrRate: z.number().positive().max(500),
    usdToInrRate: z.number().positive().max(500),
    providerOrder: z
      .array(z.enum(PAYMENT_PROVIDERS))
      .length(PAYMENT_PROVIDERS.length, "Payment provider order must include every provider once")
      .superRefine((providers, context) => {
        const uniqueProviders = new Set(providers);
        if (uniqueProviders.size !== providers.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Payment provider order cannot contain duplicates",
          });
        }
      }),
  }),
  notifications: z.object({
    emailOnEnrollment: z.boolean(),
    emailOnPayment: z.boolean(),
    emailOnLead: z.boolean(),
    whatsappOnEnrollment: z.boolean(),
    whatsappOnPayment: z.boolean(),
  }),
  reviews: z.object({
    googleReviewUrl: httpsUrl.or(emptyString),
    tripadvisorReviewUrl: httpsUrl.or(emptyString),
  }),
  assets: z.object({
    logoUrl: httpsOrRelativeUrl.or(emptyString),
    courseManualUrl: httpsOrRelativeUrl.or(emptyString),
    certificateTemplateUrl: httpsOrRelativeUrl.or(emptyString),
    mapsEmbedUrl: httpsUrl.or(emptyString),
    mapsLinkUrl: httpsUrl.or(emptyString),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const defaultSiteSettings: SiteSettings = {
  general: {
    schoolName: "Bali YTTC",
    tagline: "Transform Your Practice in Paradise",
    email: "info@baliyttc.com",
    phone: "+62 812 3456 7890",
    address: "Jl. Raya Tegallalang, Ubud, Gianyar, Bali 80571, Indonesia",
    timezone: "Asia/Makassar",
  },
  payments: {
    paypalEnabled: false,
    razorpayEnabled: false,
    bankTransferEnabled: true,
    depositEnabled: true,
    fullPaymentEnabled: true,
    displayCurrencyPrimary: "EUR",
    displayCurrencySecondary: "USD",
    razorpayCurrency: "INR",
    eurToInrRate: 90,
    usdToInrRate: 83,
    providerOrder: ["paypal", "razorpay", "bank_transfer"],
  },
  notifications: {
    emailOnEnrollment: true,
    emailOnPayment: true,
    emailOnLead: true,
    whatsappOnEnrollment: false,
    whatsappOnPayment: false,
  },
  reviews: {
    googleReviewUrl: "",
    tripadvisorReviewUrl: "",
  },
  assets: {
    logoUrl: "",
    courseManualUrl: "",
    certificateTemplateUrl: "",
    mapsEmbedUrl: "",
    mapsLinkUrl: "",
  },
};

function deepMergeSettings(value: unknown): SiteSettings {
  const partial = isRecord(value) ? value : {};
  const general = isRecord(partial.general) ? partial.general : {};
  const payments = isRecord(partial.payments) ? partial.payments : {};
  const notifications = isRecord(partial.notifications) ? partial.notifications : {};
  const reviews = isRecord(partial.reviews) ? partial.reviews : {};
  const assets = isRecord(partial.assets) ? partial.assets : {};

  const candidate = {
    ...defaultSiteSettings,
    ...partial,
    general: { ...defaultSiteSettings.general, ...general },
    payments: {
      ...defaultSiteSettings.payments,
      ...payments,
      providerOrder: normalizePaymentProviderOrder(payments.providerOrder),
    },
    notifications: { ...defaultSiteSettings.notifications, ...notifications },
    reviews: {
      ...defaultSiteSettings.reviews,
      ...reviews,
      googleReviewUrl: cleanHttpsUrl(reviews.googleReviewUrl) ?? defaultSiteSettings.reviews.googleReviewUrl,
      tripadvisorReviewUrl:
        cleanHttpsUrl(reviews.tripadvisorReviewUrl) ?? defaultSiteSettings.reviews.tripadvisorReviewUrl,
    },
    assets: {
      ...defaultSiteSettings.assets,
      ...assets,
      logoUrl: cleanHttpsOrRelativeUrl(assets.logoUrl) ?? defaultSiteSettings.assets.logoUrl,
      courseManualUrl:
        cleanHttpsOrRelativeUrl(assets.courseManualUrl) ?? defaultSiteSettings.assets.courseManualUrl,
      certificateTemplateUrl:
        cleanHttpsOrRelativeUrl(assets.certificateTemplateUrl) ?? defaultSiteSettings.assets.certificateTemplateUrl,
      mapsEmbedUrl: cleanHttpsUrl(assets.mapsEmbedUrl) ?? defaultSiteSettings.assets.mapsEmbedUrl,
      mapsLinkUrl: cleanHttpsUrl(assets.mapsLinkUrl) ?? defaultSiteSettings.assets.mapsLinkUrl,
    },
  };

  return siteSettingsSchema.parse(candidate);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: SITE_SETTINGS_KEY },
    });

    return deepMergeSettings(record?.value);
  } catch (error) {
    console.error("Failed to load site settings", error);
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(input: SiteSettings): Promise<SiteSettings> {
  const settings = siteSettingsSchema.parse(input);

  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTINGS_KEY },
    update: { value: settings },
    create: { key: SITE_SETTINGS_KEY, value: settings },
  });

  return settings;
}
