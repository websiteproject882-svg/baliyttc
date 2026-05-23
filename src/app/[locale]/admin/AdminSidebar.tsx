"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CreditCard, Settings,
  BarChart3, BookOpen, Tag, Bell, LogOut, Menu, X, ShieldCheck,
  ClipboardList, MessageCircle, Mail, Calendar, HelpCircle, FileText,
  Users2, DollarSign, FileEdit, Home, BellRing, Percent, UserPlus,
  BellDot, Image, FileText as FileTextIcon, CalendarDays, TrendingUp,
  AlertCircle as AlertCircleIcon, MailOpen, ChevronDown
} from "lucide-react";
import { canAccessAdminNavItem } from "@/lib/admin-navigation";

type AdminSidebarProps = {
  locale: string;
  user: {
    email: string;
    displayName: string;
    role: string;
  };
};

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  permission?: string;
  roles?: readonly string[];
  badge?: string;
  badgeColor?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export default function AdminSidebar({ locale, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Main", "Students", "Operations", "Finance", "Content", "Admin"]);

  const navGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: `/${locale}/admin/overview` },
        { icon: Home, label: "View Website", href: `/${locale}` },
      ],
    },
    {
      title: "Students",
      items: [
        { icon: Users, label: "All Students", href: `/${locale}/admin/students`, permission: "students.view" },
        { icon: GraduationCap, label: "Enrollments", href: `/${locale}/admin/enrollments`, permission: "enrollments.view" },
        { icon: Mail, label: "Leads & Inquiries", href: `/${locale}/admin/leads`, permission: "leads.view", badge: "New", badgeColor: "bg-green-500" },
        { icon: MessageCircle, label: "Testimonials", href: `/${locale}/admin/testimonials`, permission: "testimonials.view" },
        { icon: Calendar, label: "Waitlist", href: `/${locale}/admin/waitlist`, permission: "waitlist.view" },
      ],
    },
    {
      title: "Operations",
      items: [
        { icon: Calendar, label: "Batches", href: `/${locale}/admin/batches`, permission: "batches.view" },
        { icon: BellRing, label: "Announcements", href: `/${locale}/admin/announcements`, permission: "announcements.view" },
        { icon: BellDot, label: "Notifications", href: `/${locale}/admin/notifications`, permission: "announcements.view" },
        { icon: BookOpen, label: "Resources", href: `/${locale}/admin/resources`, permission: "prearrival.view" },
        { icon: Mail, label: "Communications", href: `/${locale}/admin/communications`, permission: "communications.view" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: DollarSign, label: "Finance Overview", href: `/${locale}/admin/finance`, permission: "payments.view" },
        { icon: Percent, label: "Coupons & Discounts", href: `/${locale}/admin/coupons`, permission: "coupons.view" },
        { icon: BarChart3, label: "Analytics", href: `/${locale}/admin/analytics`, permission: "analytics.revenue" },
      ],
    },
    {
      title: "Content",
      items: [
        { icon: BookOpen, label: "Courses", href: `/${locale}/admin/courses`, permission: "courses.view" },
        { icon: FileEdit, label: "Blog Posts", href: `/${locale}/admin/blog`, permission: "blog.view" },
        { icon: Image, label: "Gallery", href: `/${locale}/admin/gallery`, permission: "gallery.view" },
        { icon: HelpCircle, label: "FAQ Bot", href: `/${locale}/admin/faq`, permission: "faq.view" },
        { icon: FileTextIcon, label: "Email Templates", href: `/${locale}/admin/templates`, permission: "templates.view" },
        { icon: CalendarDays, label: "Ceremony Calendar", href: `/${locale}/admin/calendar`, permission: "ceremonies.view" },
      ],
    },
    {
      title: "Marketing",
      items: [
        { icon: TrendingUp, label: "Social Proof", href: `/${locale}/admin/social-proof`, permission: "social_proof.view" },
        { icon: MailOpen, label: "Abandoned Enrollments", href: `/${locale}/admin/abandoned`, permission: "communications.view" },
      ],
    },
    {
      title: "Admin",
      items: [
        { icon: ShieldCheck, label: "Staff & Roles", href: `/${locale}/admin/staff`, roles: ["SUPER_ADMIN"] },
        { icon: ClipboardList, label: "Audit Logs", href: `/${locale}/admin/audit`, roles: ["SUPER_ADMIN"] },
        { icon: Settings, label: "Settings", href: `/${locale}/admin/settings`, roles: ["SUPER_ADMIN"] },
      ],
    },
  ];

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminNavItem(user.role, item)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className={`bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col h-screen transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href={`/${locale}/admin/overview`} className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
                  Y
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">Bali YTTC</h2>
                  <p className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">Admin Panel</p>
                </div>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href={`/${locale}/admin/overview`} className="mx-auto hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
                Y
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {visibleNavGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);
          return (
            <div key={group.title} className="mb-2">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-5 py-2 text-[11px] uppercase tracking-wider text-gray-500 font-semibold hover:text-gray-400 transition-colors"
                >
                  <span>{group.title}</span>
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <div className="px-2 py-2 text-center text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-800">
                  {group.title[0]}
                </div>
              )}
              {(!isCollapsed && isExpanded) && (
                <div className="px-3 space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                          active
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={18} className={active ? "text-white" : ""} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${item.badgeColor || "bg-amber-500"}`}>
                            {item.badge}
                          </span>
                        )}
                        {isCollapsed && item.badge && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
              {isCollapsed && (
                <div className="px-2 space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-center p-2.5 rounded-lg transition-all relative ${
                          active
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}
                        title={item.label}
                      >
                        <Icon size={18} />
                        {isCollapsed && item.badge && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* User Profile */}
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user.displayName?.slice(0, 1).toUpperCase() || "A"}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.role.replaceAll("_", " ")}</p>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors text-sm ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {isCollapsed ? <Menu size={18} /> : <><X size={18} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
