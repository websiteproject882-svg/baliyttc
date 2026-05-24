import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("activities", params.locale, "/activities");
}

export default function ActivitiesLayout({ children }: { children: ReactNode }) {
  return children;
}
