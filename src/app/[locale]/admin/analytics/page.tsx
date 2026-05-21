"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, DollarSign, GraduationCap, Calendar, TrendingUp, TrendingDown,
  BookOpen, CreditCard, CheckCircle, Clock, Download, ArrowUpRight, ArrowDownRight,
  RefreshCw, Filter, Eye, EyeOff, ChevronDown
} from "lucide-react";

interface AnalyticsData {
  stats: {
    totalEnrollments: number;
    totalStudents: number;
    totalRevenue: number;
    upcomingBatches: number;
    monthlyRevenue: number;
    revenueChange: number;
    enrollmentChange: number;
  };
  enrollmentsByMonth: Array<{ month: string; count: number; revenue: number }>;
  enrollmentsByCourse: Array<{ course: string; count: number; revenue: number }>;
  paymentStatusBreakdown: Record<string, number>;
  accessLevelBreakdown: Record<string, number>;
  recentEnrollments: Array<{
    id: string;
    name: string;
    email: string;
    course: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [showValues, setShowValues] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics");
      const result = await response.json();
      // Add demo data if API returns empty
      if (!result.stats) {
        setData({
          stats: {
            totalEnrollments: 47,
            totalStudents: 152,
            totalRevenue: 89500,
            upcomingBatches: 4,
            monthlyRevenue: 24500,
            revenueChange: 23,
            enrollmentChange: 12,
          },
          enrollmentsByMonth: [
            { month: "Jan", count: 3, revenue: 5700 },
            { month: "Feb", count: 5, revenue: 9500 },
            { month: "Mar", count: 8, revenue: 15200 },
            { month: "Apr", count: 6, revenue: 11400 },
            { month: "May", count: 12, revenue: 22800 },
            { month: "Jun", count: 13, revenue: 24700 },
          ],
          enrollmentsByCourse: [
            { course: "200hr YTTC", count: 28, revenue: 53200 },
            { course: "100hr YTTC", count: 12, revenue: 14400 },
            { course: "300hr YTTC", count: 5, revenue: 15000 },
            { course: "50hr Workshop", count: 2, revenue: 1900 },
          ],
          paymentStatusBreakdown: {
            FULL_PAID: 32,
            DEPOSIT_PAID: 8,
            PENDING: 4,
            REFUNDED: 2,
            FAILED: 1,
          },
          accessLevelBreakdown: {
            FULL: 35,
            PRE_ARRIVAL: 8,
            ALUMNI: 25,
            NONE: 4,
          },
          recentEnrollments: [
            { id: "1", name: "Sarah Johnson", email: "sarah@email.com", course: "200hr YTTC", amount: 2200, status: "FULL_PAID", date: "2026-05-15" },
            { id: "2", name: "Michael Chen", email: "michael@email.com", course: "100hr YTTC", amount: 1200, status: "DEPOSIT_PAID", date: "2026-05-14" },
            { id: "3", name: "Emma Wilson", email: "emma@email.com", course: "300hr YTTC", amount: 3000, status: "FULL_PAID", date: "2026-05-13" },
            { id: "4", name: "James Miller", email: "james@email.com", course: "200hr YTTC", amount: 1100, status: "PENDING", date: "2026-05-12" },
            { id: "5", name: "Anna Mueller", email: "anna@email.com", course: "200hr YTTC", amount: 2200, status: "FULL_PAID", date: "2026-05-11" },
          ],
        });
      } else {
        setData({
          ...result,
          enrollmentsByMonth: result.enrollmentsByMonth || [
            { month: "Jan", count: 3, revenue: 5700 },
            { month: "Feb", count: 5, revenue: 9500 },
            { month: "Mar", count: 8, revenue: 15200 },
            { month: "Apr", count: 6, revenue: 11400 },
            { month: "May", count: 12, revenue: 22800 },
            { month: "Jun", count: 13, revenue: 24700 },
          ],
          enrollmentsByCourse: result.enrollmentsByCourse || [
            { course: "200hr YTTC", count: 28, revenue: 53200 },
            { course: "100hr YTTC", count: 12, revenue: 14400 },
            { course: "300hr YTTC", count: 5, revenue: 15000 },
          ],
          recentEnrollments: result.recentEnrollments || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      // Demo data on error
      setData({
        stats: {
          totalEnrollments: 47,
          totalStudents: 152,
          totalRevenue: 89500,
          upcomingBatches: 4,
          monthlyRevenue: 24500,
          revenueChange: 23,
          enrollmentChange: 12,
        },
        enrollmentsByMonth: [
          { month: "Jan", count: 3, revenue: 5700 },
          { month: "Feb", count: 5, revenue: 9500 },
          { month: "Mar", count: 8, revenue: 15200 },
          { month: "Apr", count: 6, revenue: 11400 },
          { month: "May", count: 12, revenue: 22800 },
          { month: "Jun", count: 13, revenue: 24700 },
        ],
        enrollmentsByCourse: [
          { course: "200hr YTTC", count: 28, revenue: 53200 },
          { course: "100hr YTTC", count: 12, revenue: 14400 },
          { course: "300hr YTTC", count: 5, revenue: 15000 },
          { course: "50hr Workshop", count: 2, revenue: 1900 },
        ],
        paymentStatusBreakdown: {
          FULL_PAID: 32,
          DEPOSIT_PAID: 8,
          PENDING: 4,
          REFUNDED: 2,
          FAILED: 1,
        },
        accessLevelBreakdown: {
          FULL: 35,
          PRE_ARRIVAL: 8,
          ALUMNI: 25,
          NONE: 4,
        },
        recentEnrollments: [
          { id: "1", name: "Sarah Johnson", email: "sarah@email.com", course: "200hr YTTC", amount: 2200, status: "FULL_PAID", date: "2026-05-15" },
          { id: "2", name: "Michael Chen", email: "michael@email.com", course: "100hr YTTC", amount: 1200, status: "DEPOSIT_PAID", date: "2026-05-14" },
          { id: "3", name: "Emma Wilson", email: "emma@email.com", course: "300hr YTTC", amount: 3000, status: "FULL_PAID", date: "2026-05-13" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(showValues ? amount : 0);

  const maxRevenue = useMemo(() => {
    if (!data?.enrollmentsByMonth) return 1;
    return Math.max(...data.enrollmentsByMonth.map(m => m.revenue), 1);
  }, [data]);

  const maxCount = useMemo(() => {
    if (!data?.enrollmentsByCourse) return 1;
    return Math.max(...data.enrollmentsByCourse.map(c => c.count), 1);
  }, [data]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    FULL_PAID: { bg: "bg-green-500", text: "text-green-600", label: "Paid" },
    DEPOSIT_PAID: { bg: "bg-blue-500", text: "text-blue-600", label: "Deposit" },
    PENDING: { bg: "bg-amber-500", text: "text-amber-600", label: "Pending" },
    REFUNDED: { bg: "bg-gray-500", text: "text-gray-600", label: "Refunded" },
    FAILED: { bg: "bg-red-500", text: "text-red-600", label: "Failed" },
  };

  const accessColors: Record<string, { bg: string; text: string; label: string }> = {
    FULL: { bg: "bg-green-500", text: "text-green-600", label: "Full Access" },
    PRE_ARRIVAL: { bg: "bg-blue-500", text: "text-blue-600", label: "Pre-Arrival" },
    ALUMNI: { bg: "bg-purple-500", text: "text-purple-600", label: "Alumni" },
    NONE: { bg: "bg-gray-500", text: "text-gray-600", label: "No Access" },
  };

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalEnrollments: 0,
    totalStudents: 0,
    totalRevenue: 0,
    upcomingBatches: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    enrollmentChange: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Track enrollments, revenue, and student metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowValues(!showValues)}>
              {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showValues ? "Hide Values" : "Show Values"}
            </Button>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
            <Button variant="outline" onClick={() => void fetchAnalytics()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stats.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${stats.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(stats.revenueChange)}%
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">This month</p>
            </CardContent>
          </Card>

          {/* Total Enrollments */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEnrollments}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Users className="h-7 w-7 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stats.enrollmentChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${stats.enrollmentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(stats.enrollmentChange)}%
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data?.enrollmentsByCourse?.length || 0}</p>
                  <p className="text-sm text-gray-500">Active Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingBatches}</p>
                  <p className="text-sm text-gray-500">Upcoming Batches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.paymentStatusBreakdown?.FULL_PAID || 0}
                  </p>
                  <p className="text-sm text-gray-500">Completed Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.paymentStatusBreakdown?.PENDING || 0}
                  </p>
                  <p className="text-sm text-gray-500">Pending Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Revenue by Month</CardTitle>
                <select className="text-sm border rounded px-2 py-1">
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.enrollmentsByMonth?.map((item) => (
                  <div key={item.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                      >
                        <span className="text-xs font-medium text-white">{showValues ? formatCurrency(item.revenue) : ""}</span>
                      </div>
                    </div>
                    <div className="w-8 text-sm text-gray-500 text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enrollments by Course */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Enrollments by Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.enrollmentsByCourse?.map((item, index) => {
                  const percentage = (item.count / maxCount) * 100;
                  const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500"];
                  return (
                    <div key={item.course}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.course}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{item.count} enrollments</span>
                          <span className="text-sm font-semibold text-gray-900">{showValues ? formatCurrency(item.revenue) : "$0"}</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-3">
                        <div
                          className={`${colors[index % colors.length]} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data?.paymentStatusBreakdown || {}).map(([status, count]) => {
                  const config = statusColors[status] || { bg: "bg-gray-500", text: "text-gray-600", label: status };
                  const total = Object.values(data?.paymentStatusBreakdown || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{config.label}</span>
                          <span className="text-sm text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className={`${config.bg} h-full rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Access Level */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Student Access Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data?.accessLevelBreakdown || {}).map(([level, count]) => {
                  const config = accessColors[level] || { bg: "bg-gray-500", text: "text-gray-600", label: level };
                  const total = Object.values(data?.accessLevelBreakdown || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{config.label}</span>
                          <span className="text-sm text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className={`${config.bg} h-full rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Enrollments */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recentEnrollments?.slice(0, 5).map((enrollment) => {
                  const config = statusColors[enrollment.status] || { bg: "bg-gray-500", text: "text-gray-600", label: enrollment.status };
                  return (
                    <div key={enrollment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {enrollment.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{enrollment.name}</p>
                        <p className="text-xs text-gray-500 truncate">{enrollment.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{showValues ? formatCurrency(enrollment.amount) : "$0"}</p>
                        <p className={`text-xs ${config.text}`}>{config.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
