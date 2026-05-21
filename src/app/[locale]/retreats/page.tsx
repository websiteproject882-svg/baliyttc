import Retreats from "@/views/Retreats";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export const metadata = {
  title: "Yoga Retreats in Bali | 3-Day & 7-Day Retreats in Ubud & Canggu",
  description: "Escape to Bali for a transformative yoga retreat. 3-day and 7-day retreats in Ubud and Canggu. Daily yoga, meditation, temple ceremonies, surf lessons and more.",
};

export default function RetreatsPage() {
  return (
    <NextLayoutWrapper>
      <Retreats />
    </NextLayoutWrapper>
  );
}
