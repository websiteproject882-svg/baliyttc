import Pricing from "@/views/Pricing";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export const metadata = {
  title: "Yoga Teacher Training Pricing 2026 | Course Fees & Payment Options",
  description: "Transparent pricing for yoga teacher training in Bali. 100hr from €999, 200hr from €1499, 300hr from €1899. All-inclusive with accommodation, meals, certification. Early bird discounts available.",
};

export default function PricingPage() {
  return (
    <NextLayoutWrapper>
      <Pricing />
    </NextLayoutWrapper>
  );
}
