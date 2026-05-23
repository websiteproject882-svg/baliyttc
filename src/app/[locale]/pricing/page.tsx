import Pricing from "@/views/Pricing";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export const metadata = {
  title: "Yoga Teacher Training Pricing 2026 | Course Fees & Payment Options",
  description: "Transparent pricing for yoga teacher training in Bali. 50hr from EUR 499, 100hr from EUR 699, 200hr from EUR 1499, 300hr from EUR 1899. Payment options and early bird offers available.",
};

export default function PricingPage() {
  return (
    <NextLayoutWrapper>
      <Pricing />
    </NextLayoutWrapper>
  );
}
