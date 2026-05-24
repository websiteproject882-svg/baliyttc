import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, UserCircle2, BarChart3, Calendar,
  StickyNote, Bell, Award, MessageSquare, BookOpen, ExternalLink, Plane, LifeBuoy, Megaphone, Video
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudentSession } from "@/lib/session";
import { PWAStatus } from "@/components/student/PWAStatus";

export const metadata: Metadata = {
  title: "Student Portal | Bali YTTC",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getStudentSession();

  if (!session?.userId) {
    redirect(`/${params.locale}/login`);
  }

  const student = await prisma.student.findUnique({
    where: { userId: String(session.userId) },
    include: {
      batch: {
        select: {
          name: true,
          startDate: true,
          course: { select: { name: true } },
        },
      },
      enrollments: {
        where: { paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          batchId: true,
        },
      },
    },
  });

  if (!student || student.accessLevel === "NONE") {
    redirect(`/${params.locale}/login`);
  }

  const sessionEmail = typeof session.email === "string" ? session.email : "";

  const accessLevelColors: Record<string, { bg: string; text: string }> = {
    PRE_ARRIVAL: { bg: "bg-blue-50", text: "text-blue-600" },
    FULL: { bg: "bg-green-50", text: "text-green-600" },
    ALUMNI: { bg: "bg-amber-50", text: "text-amber-600" },
  };

  const accessLevelLabels: Record<string, string> = {
    PRE_ARRIVAL: "Pre-Arrival",
    FULL: "Full Access",
    ALUMNI: "Alumni",
  };

  const accessStyle = accessLevelColors[student.accessLevel] || accessLevelColors.PRE_ARRIVAL;
  const accessLabel = accessLevelLabels[student.accessLevel] || "Student";
  const fallbackBatch =
    !student.batch && student.enrollments[0]?.batchId
      ? await prisma.batch.findUnique({
          where: { id: student.enrollments[0].batchId },
          select: {
            name: true,
            startDate: true,
            course: { select: { name: true } },
          },
        })
      : null;
  const activeBatch = student.batch || fallbackBatch;

  const navItems = [
    { href: `/${params.locale}/app/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${params.locale}/app/pre-arrival`, label: "Pre-Arrival", icon: Plane },
    { href: `/${params.locale}/app/lessons`, label: "Video Lessons", icon: Video },
    { href: `/${params.locale}/app/profile`, label: "Profile", icon: UserCircle2 },
    { href: `/${params.locale}/app/progress`, label: "Progress", icon: BarChart3 },
    { href: `/${params.locale}/app/schedule`, label: "Schedule", icon: Calendar },
    { href: `/${params.locale}/app/announcements`, label: "Announcements", icon: Megaphone },
    { href: `/${params.locale}/app/notes`, label: "Notes", icon: StickyNote },
    { href: `/${params.locale}/app/notifications`, label: "Notifications", icon: Bell },
    { href: `/${params.locale}/app/certificates`, label: "Certificates", icon: Award },
    { href: `/${params.locale}/app/reviews`, label: "Leave Review", icon: MessageSquare },
    { href: `/${params.locale}/app/dashboard#resources`, label: "Resources", icon: BookOpen },
    { href: `/${params.locale}/app/support`, label: "Support", icon: LifeBuoy },
  ];

  const mobileNavItems = [
    navItems[0],
    navItems[2],
    navItems[5],
    navItems[7],
    navItems[3],
  ];

  const mobileQuickLinks = navItems.filter((item) =>
    ["Pre-Arrival", "Progress", "Announcements", "Notifications", "Certificates", "Leave Review", "Support"].includes(item.label)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-white border-r border-gray-200 md:flex md:flex-col">
        {/* Logo & Access Badge */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              YTTC
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-gray-900">Bali YTTC</h2>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Student Portal</p>
            </div>
          </div>

          {/* Access Level Badge */}
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${accessStyle.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${accessStyle.text.replace("text-", "bg-")}`} />
            <span className={`text-[10px] font-semibold ${accessStyle.text}`}>{accessLabel}</span>
          </div>

          {/* Batch Info */}
          {activeBatch && (
            <div className="mt-3 p-2.5 rounded-lg bg-gray-50">
              <p className="text-xs font-medium text-gray-900 truncate">{activeBatch.course?.name}</p>
              <p className="text-[10px] text-gray-500">{activeBatch.name}</p>
              {activeBatch.startDate && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Starts {new Date(activeBatch.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* View Website Link */}
          <Link
            href={`/${params.locale}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Website
          </Link>

          {/* User & Logout */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-xs">
              {sessionEmail[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{sessionEmail}</p>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-[10px] text-gray-500 hover:text-orange-600 transition-colors">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Bali YTTC</p>
              <p className="truncate text-xs text-gray-500">{activeBatch?.course?.name || "Student Portal"}</p>
            </div>
            <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${accessStyle.bg} ${accessStyle.text}`}>
              {accessLabel}
            </div>
          </div>
          <div className="mt-3">
            <PWAStatus />
          </div>
        </div>
        <div className="border-b border-gray-100 bg-white px-4 py-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mobileQuickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gray-200 bg-white px-1 py-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
