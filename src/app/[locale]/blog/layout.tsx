import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("blog", params.locale, "/blog");
}

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
