"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellDot,
  BellRing,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileEdit,
  FileText as FileTextIcon,
  GraduationCap,
  HelpCircle,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  MailOpen,
  Menu,
  MessageCircle,
  Percent,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { canAccessAdminNavItem } from "@/lib/admin-navigation";

type AdminSidebarProps = {
  locale: string;
  user: {
    email: string;
    displayName: string;
    role: string;
    permissions: string[];
  };
};

type NavItem = {
  icon: ElementType;
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "Main",
    "Students",
    "Operations",
    "Finance",
    "Content",
    "Marketing",
    "Admin",
  ]);

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
        { icon: Mail, label: "Leads & Inquiries", href: `/${locale}/admin/leads`, permission: "leads.view", badge: "New", badgeColor: "bg-emerald-600" },
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
      items: group.items.filter((item) => canAccessAdminNavItem(user.role, item, user.permissions)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}`;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobile = () => setIsMobileOpen(false);
  const roleLabel = user.role.replaceAll("_", " ").toLowerCase();
  const userInitial = user.displayName?.slice(0, 1).toUpperCase() || "A";

  const sidebar = (
    <aside
      className={[
        "flex h-screen flex-col border-r border-orange-100/80 bg-[#fffaf4] text-slate-900 shadow-[18px_0_50px_rgba(15,23,42,0.08)] transition-all duration-300",
        isCollapsed ? "lg:w-20" : "lg:w-[18.5rem]",
        "w-[19.5rem]",
      ].join(" ")}
    >
      <div className="border-b border-orange-100 p-4">
        <div className={`flex items-center gap-3 ${isCollapsed ? "lg:justify-center" : "justify-between"}`}>
          <Link
            href={`/${locale}/admin/overview`}
            className={`flex min-w-0 items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-orange-500 ${isCollapsed ? "lg:justify-center" : ""}`}
            onClick={closeMobile}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20">
              BY
            </span>
            {!isCollapsed && (
              <span className="min-w-0 lg:block">
                <span className="block truncate text-base font-bold leading-tight text-slate-950">Bali YTTC</span>
                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                  Admin workspace
                </span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={closeMobile}
            className="rounded-full p-2 text-slate-500 transition hover:bg-orange-100 hover:text-slate-950 lg:hidden"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        </div>

        {!isCollapsed && (
          <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Sparkles size={14} className="text-orange-600" />
              <span>Live content control</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Manage courses, leads, blog, gallery and student updates from one place.
            </p>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {visibleNavGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);

          return (
            <section key={group.title} className="mb-3">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 transition hover:bg-white hover:text-slate-900"
                >
                  <span>{group.title}</span>
                  <ChevronDown size={15} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <div className="mx-auto mb-2 hidden h-px w-8 bg-orange-200 lg:block" />
              )}

              {(isExpanded || isCollapsed) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        title={isCollapsed ? item.label : undefined}
                        className={[
                          "group relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-orange-500",
                          isCollapsed ? "lg:justify-center lg:px-0" : "",
                          active
                            ? "bg-white text-orange-700 shadow-sm ring-1 ring-orange-200"
                            : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm",
                        ].join(" ")}
                      >
                        {active && !isCollapsed && (
                          <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-orange-600" />
                        )}
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition",
                            active
                              ? "bg-orange-600 text-white shadow-sm shadow-orange-600/20"
                              : "bg-orange-50 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-700",
                          ].join(" ")}
                        >
                          <Icon size={17} />
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${item.badgeColor || "bg-amber-500"}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {isCollapsed && item.badge && (
                          <span className="absolute right-3 top-2 hidden h-2 w-2 rounded-full bg-emerald-500 lg:block" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </nav>

      <div className="border-t border-orange-100 p-3">
        <div
          className={`flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm ${
            isCollapsed ? "lg:justify-center lg:p-2" : ""
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
            {userInitial}
          </span>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{user.displayName}</p>
                <p className="truncate text-xs capitalize text-slate-500">{roleLabel}</p>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-orange-50 hover:text-orange-700"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className={`mt-3 hidden w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950 lg:flex ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {isCollapsed ? <Menu size={18} /> : <><X size={17} /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-orange-100 bg-[#fffaf4]/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-2xl border border-orange-200 bg-white p-2.5 text-slate-800 shadow-sm"
          aria-label="Open admin menu"
        >
          <Menu size={20} />
        </button>
        <Link href={`/${locale}/admin/overview`} className="flex items-center gap-2 font-bold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-600 text-xs text-white">BY</span>
          <span>Admin</span>
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded-2xl border border-orange-200 bg-white p-2.5 text-slate-700 shadow-sm"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </form>
      </header>

      <div className="hidden h-screen shrink-0 lg:sticky lg:top-0 lg:block">{sidebar}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={closeMobile}
            aria-label="Close admin menu overlay"
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}
    </>
  );
}
