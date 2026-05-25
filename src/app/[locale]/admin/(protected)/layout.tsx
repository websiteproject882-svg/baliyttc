import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "../AdminSidebar";
import { requireAdminUser } from "@/lib/authz";

export default async function ProtectedAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { user } = await requireAdminUser();

  if (!user) {
    redirect(`/${params.locale}/admin/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <AdminSidebar
        locale={params.locale}
        user={{
          email: user.email,
          displayName: user.displayName || user.email,
          role: user.role,
          permissions: user.permissions,
        }}
      />
      <main className="min-w-0 flex-1 bg-gray-50 pt-[65px] lg:pt-0">{children}</main>
    </div>
  );
}
