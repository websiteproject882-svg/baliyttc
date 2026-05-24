import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSiteSettings, getSiteSettings, SITE_SETTINGS_KEY, siteSettingsSchema } from "../lib/site-settings";

const mocks = vi.hoisted(() => ({
  siteSettingFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    siteSetting: {
      findUnique: mocks.siteSettingFindUnique,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("site settings loader", () => {
  it("keeps valid legacy settings while sanitizing old insecure public URLs", async () => {
    mocks.siteSettingFindUnique.mockResolvedValue({
      key: SITE_SETTINGS_KEY,
      value: {
        ...defaultSiteSettings,
        general: {
          ...defaultSiteSettings.general,
          schoolName: "Client Bali School",
        },
        payments: {
          ...defaultSiteSettings.payments,
          paypalEnabled: true,
          providerOrder: ["razorpay", "paypal", "legacy"],
        },
        reviews: {
          googleReviewUrl: "http://example.com/review",
          tripadvisorReviewUrl: " https://tripadvisor.example.com/review ",
        },
        assets: {
          logoUrl: "//evil.example/logo.png",
          courseManualUrl: " /downloads/course-manual.pdf ",
          certificateTemplateUrl: " https://example.com/certificate.png ",
          mapsEmbedUrl: "http://maps.example.com/embed",
          mapsLinkUrl: " https://maps.example.com/place ",
        },
      },
    });

    const settings = await getSiteSettings();

    expect(mocks.siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: SITE_SETTINGS_KEY },
    });
    expect(settings.general.schoolName).toBe("Client Bali School");
    expect(settings.payments.paypalEnabled).toBe(true);
    expect(settings.payments.providerOrder).toEqual(["razorpay", "paypal", "bank_transfer"]);
    expect(settings.reviews.googleReviewUrl).toBe("");
    expect(settings.reviews.tripadvisorReviewUrl).toBe("https://tripadvisor.example.com/review");
    expect(settings.assets.logoUrl).toBe("");
    expect(settings.assets.courseManualUrl).toBe("/downloads/course-manual.pdf");
    expect(settings.assets.certificateTemplateUrl).toBe("https://example.com/certificate.png");
    expect(settings.assets.mapsEmbedUrl).toBe("");
    expect(settings.assets.mapsLinkUrl).toBe("https://maps.example.com/place");
  });

  it("normalizes admin editable text and URL settings", () => {
    const parsed = siteSettingsSchema.parse({
      ...defaultSiteSettings,
      general: {
        schoolName: " Bali School ",
        tagline: " Transform in Ubud ",
        email: " INFO@Example.COM ",
        phone: " +62 812 ",
        address: " Ubud, Bali ",
        timezone: " Asia/Makassar ",
      },
      reviews: {
        googleReviewUrl: " https://example.com/review ",
        tripadvisorReviewUrl: "",
      },
      assets: {
        ...defaultSiteSettings.assets,
        logoUrl: " /images/logo.png ",
      },
    });

    expect(parsed.general).toEqual({
      schoolName: "Bali School",
      tagline: "Transform in Ubud",
      email: "info@example.com",
      phone: "+62 812",
      address: "Ubud, Bali",
      timezone: "Asia/Makassar",
    });
    expect(parsed.reviews.googleReviewUrl).toBe("https://example.com/review");
    expect(parsed.assets.logoUrl).toBe("/images/logo.png");
  });

  it("rejects protocol-relative local asset URLs", () => {
    const parsed = siteSettingsSchema.safeParse({
      ...defaultSiteSettings,
      assets: {
        ...defaultSiteSettings.assets,
        logoUrl: "//evil.example/logo.png",
      },
    });

    expect(parsed.success).toBe(false);
  });
});
