import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("videos", params.locale, "/videos");
}

export default function VideosLayout({ children }: { children: ReactNode }) {
  return children;
}
