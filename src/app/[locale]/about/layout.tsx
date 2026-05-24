import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("about", params.locale, "/about");
}

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
