import { z } from "zod";
import prisma from "@/lib/prisma";

export const SITE_SETTINGS_KEY = "site_settings";
export const PAYMENT_PROVIDERS = ["paypal", "razorpay", "bank_transfer"] as const;

export const siteSettingsSchema = z.object({
  general: z.object({
    schoolName: z.string().min(1).max(120),
    tagline: z.string().max(180),
    email: z.string().email(),
    phone: z.string().max(60),
    address: z.string().max(300),
    timezone: z.string().min(1).max(80),
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
    googleReviewUrl: z.string().url().or(z.literal("")),
    tripadvisorReviewUrl: z.string().url().or(z.literal("")),
  }),
  assets: z.object({
    logoUrl: z.string().url().or(z.literal("")),
    courseManualUrl: z.string().url().or(z.literal("")),
    certificateTemplateUrl: z.string().url().or(z.literal("")),
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
  },
};

function deepMergeSettings(value: unknown): SiteSettings {
  const parsed = siteSettingsSchema.partial().safeParse(value);
  const partial = parsed.success ? parsed.data : {};

  return siteSettingsSchema.parse({
    ...defaultSiteSettings,
    ...partial,
    general: { ...defaultSiteSettings.general, ...partial.general },
    payments: { ...defaultSiteSettings.payments, ...partial.payments },
    notifications: { ...defaultSiteSettings.notifications, ...partial.notifications },
    reviews: { ...defaultSiteSettings.reviews, ...partial.reviews },
    assets: { ...defaultSiteSettings.assets, ...partial.assets },
  });
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
