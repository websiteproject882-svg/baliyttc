import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("gallery", params.locale, "/gallery");
}

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return children;
}
