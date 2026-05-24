"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users, DollarSign, GraduationCap, Calendar, BookOpen, CreditCard, Tag,
  MessageCircle, Bell, Award, TrendingUp, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, Eye, Mail, ChevronRight, Loader2,
  BarChart3, FileText, Globe, Settings, Shield, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalEnrollments: number;
  totalStudents: number;
  totalRevenue: number;
  upcomingBatches: number;
  monthlyRevenue: number;
  revenueChange: number;
  enrollmentChange: number;
}

export default function AdminOverview() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/analytics");
        const data = await response.json();
        setStats({
          ...data.stats,
          revenueChange: data.stats?.revenueChange ?? 0,
          enrollmentChange: data.stats?.enrollmentChange ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchStats();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Enrollments",
      value: stats.totalEnrollments,
      change: `+${stats.enrollmentChange}%`,
      trend: "up" as const,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      href: `/${locale}/admin/enrollments`,
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      change: `+${stats.revenueChange}%`,
      trend: "up" as const,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      href: `/${locale}/admin/finance`,
    },
    {
      label: "Active Students",
      value: stats.totalStudents,
      trend: "neutral" as const,
      icon: GraduationCap,
      gradient: "from-purple-500 to-purple-600",
      href: `/${locale}/admin/students`,
    },
    {
      label: "Upcoming Batches",
      value: stats.upcomingBatches,
      trend: "neutral" as const,
      icon: Calendar,
      gradient: "from-orange-500 to-orange-600",
      href: `/${locale}/admin/batches`,
    },
  ];

  const quickActions = [
    { label: "New Enrollment", icon: Plus, href: `/${locale}/admin/enrollments`, gradient: "bg-blue-50 text-blue-600" },
    { label: "View Students", icon: Users, href: `/${locale}/admin/students`, gradient: "bg-purple-50 text-purple-600" },
    { label: "Announce", icon: Bell, href: `/${locale}/admin/announcements`, gradient: "bg-green-50 text-green-600" },
    { label: "Create Coupon", icon: Tag, href: `/${locale}/admin/coupons`, gradient: "bg-pink-50 text-pink-600" },
    { label: "Batches", icon: Calendar, href: `/${locale}/admin/batches`, gradient: "bg-orange-50 text-orange-600" },
    { label: "Leads", icon: MessageCircle, href: `/${locale}/admin/leads`, gradient: "bg-cyan-50 text-cyan-600" },
    { label: "Analytics", icon: BarChart3, href: `/${locale}/admin/analytics`, gradient: "bg-indigo-50 text-indigo-600" },
    { label: "Settings", icon: Settings, href: `/${locale}/admin/settings`, gradient: "bg-gray-50 text-gray-600" },
  ];

  if (!stats) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            Analytics data could not be loaded.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening at Bali YTTC today.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-gray-200">
              <Link href={`/${locale}`}>
                <Globe className="h-4 w-4 mr-2" />
                View Site
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Link href={`/${locale}/admin/announcements`}>
                <Bell className="h-4 w-4 mr-2" />
                New Announcement
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.label} href={metric.href}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer">
                  <div className={`h-1.5 bg-gradient-to-r ${metric.gradient}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {metric.change && (
                        <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
                          metric.trend === "up" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                        }`}>
                          {metric.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : null}
                          {metric.change}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white transition-all duration-200 group cursor-pointer`}>
                      <div className={`w-10 h-10 rounded-xl ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center">{action.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Card */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <Badge className="bg-green-100 text-green-700">All Time</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-xs text-green-600 font-medium">This Month</p>
                  <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium">Avg. Per Student</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">
                    {stats.totalStudents ? formatCurrency(stats.totalRevenue / stats.totalStudents) : "$0"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <p className="text-xs text-purple-600 font-medium">Total Students</p>
                  <p className="text-lg font-bold text-purple-700 mt-1">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Database", status: "Connected", color: "green" },
                  { name: "Auth Service", status: "Active", color: "green" },
                  { name: "Payment Gateway", status: "Ready", color: "amber" },
                  { name: "Email Service", status: "Ready", color: "green" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full bg-${item.color}-500 animate-pulse`} />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <Badge className={`bg-${item.color}-100 text-${item.color}-700`}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/admin/audit`}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { action: "New enrollment", user: "Sarah Johnson", time: "2 min ago", icon: Users, color: "text-green-600" },
                { action: "Payment received", user: "Michael Chen - $300", time: "1 hour ago", icon: CreditCard, color: "text-green-600" },
                { action: "New lead", user: "Anna Mueller", time: "3 hours ago", icon: MessageCircle, color: "text-blue-600" },
                { action: "Access granted", user: "Emma Wilson", time: "5 hours ago", icon: Shield, color: "text-purple-600" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-${item.color.replace("text-", "")}/10 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500">{item.user}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
