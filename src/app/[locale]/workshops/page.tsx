import Workshops from "@/views/Workshops";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";

export const metadata = {
  title: "Yoga Workshops in Bali | Sound Healing, Acro Yoga, Arm Balancing",
  description: "Join our standalone yoga workshops in Ubud, Bali. Sound healing, acro yoga, arm balancing, and mandala painting workshops with senior teachers. Book individually or save with packages.",
};

export default function WorkshopsPage() {
  return (
    <NextLayoutWrapper>
      <Workshops />
    </NextLayoutWrapper>
  );
}
