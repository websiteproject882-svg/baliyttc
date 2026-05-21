import VisaInfo from "@/views/VisaInfo";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export const metadata = {
  title: "Bali Visa Guide for Yoga Students | VOA, B211A, Requirements",
  description: "Complete Bali visa guide for yoga teacher training students. VOA, B211A social visa, Digital Nomad visa explained. Country-specific guidance for EU, US, UK, Australia and more.",
};

export default function VisaPage() {
  return (
    <NextLayoutWrapper>
      <VisaInfo />
    </NextLayoutWrapper>
  );
}
