import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { StaffSidebar } from "./StaffSidebar";

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
