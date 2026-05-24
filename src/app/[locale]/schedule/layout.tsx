import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("schedule", params.locale, "/schedule");
}

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
