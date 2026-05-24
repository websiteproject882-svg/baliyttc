import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { assertRuntimeEnv } from "@/lib/env-validation";
import { getSiteSettings } from "@/lib/site-settings";
import { LocalBusinessSchema, OrganizationSchema } from "@/components/shared/SchemaMarkup";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F04E23",
};

export const metadata: Metadata = {
  title: "Bali YTTC - Yoga Teacher Training in Bali",
  description: "Transform your life with world-class yoga teacher training in the heart of Bali. Yoga Alliance certified courses in Ubud, Bali.",
  keywords: ["yoga teacher training", "bali", "ubud", "yoga alliance", "200 hour yoga", "100 hour yoga"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bali YTTC",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  assertRuntimeEnv();
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <OrganizationSchema settings={siteSettings} />
        <LocalBusinessSchema settings={siteSettings} />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
