"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BalieytcLogo } from "@/components/shared/BalieytcLogo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Image,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/rbac";

const navigationItems = [
  { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Schedule", href: "/staff/schedule", icon: Calendar, permission: "schedule.view" },
  { name: "My Batch", href: "/staff/my-batch", icon: Users, permission: "students.view_own_batch" },
  { name: "Announcements", href: "/staff/announcements", icon: MessageSquare, permission: "announcements.view" },
  { name: "Blog", href: "/staff/blog", icon: FileText, permission: "blog.view" },
  { name: "Gallery", href: "/staff/gallery", icon: Image, permission: "gallery.view" },
  { name: "Settings", href: "/staff/settings", icon: Settings, permission: null },
];

export function StaffSidebar() {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const locale = params.locale || "en";

  const filteredNav = navigationItems.filter(
    (item) => !item.permission || (role && hasPermission(role, item.permission))
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-emerald-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-emerald-800">
        <Link href={`/${locale}/staff/dashboard`} className="flex items-center gap-3">
          <BalieytcLogo className="h-10 w-10" showText={false} />
          <div>
            <span className="font-serif text-xl font-bold">Bali YTTC</span>
            <span className="block text-xs text-emerald-400">Staff Portal</span>
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3 bg-emerald-800/50">
        <span className="text-xs text-emerald-300 uppercase tracking-wide">Logged in as</span>
        <p className="font-semibold">{role || "Staff"}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {filteredNav.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "text-emerald-100 hover:bg-emerald-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-emerald-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-emerald-100 hover:bg-emerald-800 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
