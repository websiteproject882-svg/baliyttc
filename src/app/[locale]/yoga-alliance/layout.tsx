import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("yogaAlliance", params.locale, "/yoga-alliance");
}

export default function YogaAllianceLayout({ children }: { children: ReactNode }) {
  return children;
}
