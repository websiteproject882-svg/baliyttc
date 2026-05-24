import Pricing from "@/views/Pricing";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("pricing", params.locale, "/pricing");
}

export default function PricingPage() {
  return (
    <NextLayoutWrapper>
      <Pricing />
    </NextLayoutWrapper>
  );
}
