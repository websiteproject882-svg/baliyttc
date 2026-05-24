import Workshops from "@/views/Workshops";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("workshops", params.locale, "/workshops");
}

export default function WorkshopsPage() {
  return (
    <NextLayoutWrapper>
      <Workshops />
    </NextLayoutWrapper>
  );
}
