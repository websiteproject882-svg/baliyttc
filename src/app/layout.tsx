import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { assertRuntimeEnv } from "@/lib/env-validation";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  assertRuntimeEnv();

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
