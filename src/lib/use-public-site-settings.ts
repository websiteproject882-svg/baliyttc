"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE } from "@/data/site";

export type PublicSiteSettings = {
  general: {
    schoolName: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
  };
  reviews: {
    googleReviewUrl: string;
    tripadvisorReviewUrl: string;
  };
  assets: {
    logoUrl: string;
    courseManualUrl: string;
    certificateTemplateUrl: string;
    mapsEmbedUrl: string;
    mapsLinkUrl: string;
  };
};

export const fallbackPublicSiteSettings: PublicSiteSettings = {
  general: {
    schoolName: SITE.name,
    tagline: SITE.tagline,
    email: SITE.email,
    phone: SITE.phone,
    address: SITE.location,
    timezone: "Asia/Makassar",
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

export function getWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return SITE.whatsapp;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function usePublicSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(fallbackPublicSiteSettings);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings");
        if (!response.ok) return;
        const data = (await response.json()) as { settings?: PublicSiteSettings };
        if (!cancelled && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        // Keep static defaults when public settings are unavailable.
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      ...settings,
      logoUrl: settings.assets.logoUrl || "/images/brand/logo-512.png",
      mapsEmbedUrl: settings.assets.mapsEmbedUrl || SITE.mapsEmbed,
      mapsLinkUrl: settings.assets.mapsLinkUrl || SITE.mapsLink,
      whatsappNumber: getWhatsAppNumber(settings.general.phone),
    }),
    [settings],
  );
}
