import VisaInfo from "@/views/VisaInfo";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("visa", params.locale, "/visa");
}

export default function VisaPage() {
  return (
    <NextLayoutWrapper>
      <VisaInfo />
    </NextLayoutWrapper>
  );
}
