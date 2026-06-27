import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { assertRuntimeEnv } from "@/lib/env-validation";
import { getSiteSettings } from "@/lib/site-settings";
import { LocalBusinessSchema, OrganizationSchema } from "@/components/shared/SchemaMarkup";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
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
