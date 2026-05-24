import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("terms", params.locale, "/terms");
}

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
