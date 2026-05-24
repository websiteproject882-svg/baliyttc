import Retreats from "@/views/Retreats";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("retreats", params.locale, "/retreats");
}

export default function RetreatsPage() {
  return (
    <NextLayoutWrapper>
      <Retreats />
    </NextLayoutWrapper>
  );
}
