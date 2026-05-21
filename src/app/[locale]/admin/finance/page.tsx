"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Clock,
  CheckCircle, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
  Download, Filter
} from "lucide-react";

interface AnalyticsStats {
  totalEnrollments: number;
  totalStudents: number;
  totalRevenue: number;
  upcomingBatches: number;
  monthlyRevenue: number;
}

interface Enrollment {
  id: string;
  name: string;
  email: string;
  courseSlug: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentType: string;
  createdAt: string;
  payments?: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

const statusConfig = {
  PENDING: { color: "bg-amber-100 text-amber-800", icon: Clock, label: "Pending" },
  DEPOSIT_PAID: { color: "bg-blue-100 text-blue-800", icon: CreditCard, label: "Deposit Paid" },
  FULL_PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Paid" },
  FAILED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
  REFUNDED: { color: "bg-gray-100 text-gray-800", icon: AlertCircle, label: "Refunded" },
};

const methodLabels: Record<string, string> = {
  RAZORPAY: "Razorpay",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Bank Transfer",
};

export default function FinancePage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "DEPOSIT_PAID" | "FULL_PAID">("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, enrollmentsRes] = await Promise.all([
          fetch("/api/admin/analytics"),
          fetch("/api/enrollments?limit=100"),
        ]);
        const [analyticsData, enrollmentsData] = await Promise.all([
          analyticsRes.json(),
          enrollmentsRes.json(),
        ]);
        setStats(analyticsData.stats);
        setEnrollments(enrollmentsData.enrollments || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const filteredEnrollments = enrollments.filter((e) =>
    filter === "all" || e.paymentStatus === filter
  );

  // Calculate summary metrics
  const pendingPayments = enrollments.filter((e) => e.paymentStatus === "PENDING");
  const depositPayments = enrollments.filter((e) => e.paymentStatus === "DEPOSIT_PAID");
  const fullPayments = enrollments.filter((e) => e.paymentStatus === "FULL_PAID");
  const failedPayments = enrollments.filter((e) => e.paymentStatus === "FAILED");

  const totalPending = pendingPayments.reduce((sum, e) => sum + e.amount, 0);
  const totalDeposits = depositPayments.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = fullPayments.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      subtext: `${fullPayments.length} completed payments`,
    },
    {
      label: "This Month",
      value: formatCurrency(stats?.monthlyRevenue || 0),
      change: "+12%",
      trend: "up",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
      subtext: "Revenue this month",
    },
    {
      label: "Pending",
      value: formatCurrency(totalPending),
      change: `${pendingPayments.length} pending`,
      trend: "neutral",
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
      subtext: "Awaiting payment",
    },
    {
      label: "Deposits",
      value: formatCurrency(totalDeposits),
      change: `${depositPayments.length} deposits`,
      trend: "neutral",
      icon: CreditCard,
      color: "text-purple-600 bg-purple-50",
      subtext: "In progress",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Payment status and revenue tracking</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-0 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${metric.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{metric.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{metric.subtext}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = enrollments.filter((e) => e.paymentStatus === status).length;
          const total = enrollments.filter((e) => e.paymentStatus === status).reduce((sum, e) => sum + e.amount, 0);
          const StatusIcon = config.icon;
          return (
            <Card key={status} className={`border-0 bg-white shadow-sm ${count === 0 ? "opacity-50" : ""}`}>
              <CardContent className="p-4 text-center">
                <div className={`inline-flex rounded-full p-2 mb-2 ${config.color}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{config.label}</p>
                {total > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(total)}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment History */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment History</CardTitle>
              <CardDescription>Recent enrollments and payment status</CardDescription>
            </div>
            <div className="flex gap-2">
              {(["all", "FULL_PAID", "DEPOSIT_PAID", "PENDING"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : statusConfig[f].label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Student</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Course</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Payment Method</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.slice(0, 50).map((enrollment) => {
                    const latestPayment = enrollment.payments?.[0];
                    const config = statusConfig[enrollment.paymentStatus as keyof typeof statusConfig] || statusConfig.PENDING;
                    const StatusIcon = config.icon;

                    return (
                      <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                              {enrollment.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "S"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{enrollment.name}</p>
                              <p className="text-xs text-gray-500">{enrollment.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm uppercase">{enrollment.courseSlug}</td>
                        <td className="py-3 px-2 text-sm text-gray-500">{formatDate(enrollment.createdAt)}</td>
                        <td className="py-3 px-2 text-sm">
                          {latestPayment ? (
                            <Badge variant="outline">{methodLabels[latestPayment.method] || latestPayment.method}</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-medium">
                          {formatCurrency(enrollment.amount, enrollment.currency)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
