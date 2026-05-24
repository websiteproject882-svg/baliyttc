import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("accommodation", params.locale, "/accommodation");
}

export default function AccommodationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
