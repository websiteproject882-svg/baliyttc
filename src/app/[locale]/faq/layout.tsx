import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("faq", params.locale, "/faq");
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
