import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("instructors", params.locale, "/instructors");
}

export default function InstructorsLayout({ children }: { children: ReactNode }) {
  return children;
}
