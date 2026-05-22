import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import { getCurrentUser } from "@/lib/authz";
import { isAdminPanelRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  if (!isAdminPanelRole(user.role) && user.role !== "ADMIN") {
    redirect(`/${params.locale}/login`);
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar
        locale={params.locale}
        user={{
          email: user.email,
          displayName: user.displayName || user.email,
          role: user.role,
        }}
      />
      <main className="min-w-0 flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
