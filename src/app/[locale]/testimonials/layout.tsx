import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("testimonials", params.locale, "/testimonials");
}

export default function TestimonialsLayout({ children }: { children: ReactNode }) {
  return children;
}
