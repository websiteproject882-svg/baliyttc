import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("contact", params.locale, "/contact");
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
