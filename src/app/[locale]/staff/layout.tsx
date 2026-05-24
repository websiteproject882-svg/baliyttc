import type { Metadata } from "next";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { StaffSidebar } from "./StaffSidebar";

export const metadata: Metadata = {
  title: "Staff Portal | Bali YTTC",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextLayoutWrapper>
      <div className="flex min-h-screen bg-gray-100">
        <StaffSidebar />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </NextLayoutWrapper>
  );
}
