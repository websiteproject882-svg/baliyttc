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
import { filterStaffNavigationItems } from "@/lib/staff-navigation";

const navigationItems = [
  {
    name: "Dashboard",
    href: (role?: string | null) => (role === "TEACHER" ? "/app/teacher/dashboard" : "/admin/overview"),
    icon: LayoutDashboard,
    permission: null,
    adminOnly: false,
  },
  {
    name: "Schedule",
    href: (role?: string | null) => (role === "TEACHER" ? "/app/teacher/dashboard" : "/admin/calendar"),
    icon: Calendar,
    permission: "schedule.view",
    adminOnly: false,
  },
  {
    name: "My Batch",
    href: () => "/app/teacher/dashboard",
    icon: Users,
    permission: "students.view_own_batch",
    adminOnly: false,
  },
  {
    name: "Announcements",
    href: (role?: string | null) => (role === "TEACHER" ? "/app/teacher/dashboard" : "/admin/announcements"),
    icon: MessageSquare,
    permission: "announcements.view",
    adminOnly: false,
  },
  { name: "Blog", href: () => "/admin/blog", icon: FileText, permission: "blog.view", adminOnly: true },
  { name: "Gallery", href: () => "/admin/gallery", icon: Image, permission: "gallery.view", adminOnly: true },
  { name: "Admin Home", href: () => "/admin/overview", icon: Settings, permission: null, adminOnly: true },
];

export function StaffSidebar() {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const locale = params.locale || "en";

  const filteredNav = filterStaffNavigationItems(navigationItems, role);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-emerald-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-emerald-800">
        <Link href={`/${locale}${role === "TEACHER" ? "/app/teacher/dashboard" : "/admin/overview"}`} className="flex items-center gap-3">
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
            const href = `/${locale}${item.href(role)}`;
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
