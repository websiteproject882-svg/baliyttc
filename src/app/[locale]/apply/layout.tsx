import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("apply", params.locale, "/apply");
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
