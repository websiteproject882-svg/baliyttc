"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, Mail, Eye, CheckCircle, Clock, Loader2, CreditCard, XCircle,
  DollarSign, BookOpen, RefreshCw, Shield, Download, ChevronLeft, ChevronRight
} from "lucide-react";

interface Enrollment {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseSlug: string;
  amount: number;
  currency: string;
  paymentStatus: "PENDING" | "DEPOSIT_PAID" | "FULL_PAID" | "FAILED" | "REFUNDED";
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  createdAt: string;
  updatedAt: string;
  batch?: { id: string; name: string; startDate: string };
  payments?: Array<{
    id: string;
    method: "RAZORPAY" | "PAYPAL" | "BANK_TRANSFER";
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
  }>;
  student?: {
    id: string;
    completedHours: number;
    totalHours: number;
    certificateIssued: boolean;
  } | null;
}

const paymentConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  PENDING: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending", icon: Clock },
  DEPOSIT_PAID: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Deposit Paid", icon: CreditCard },
  FULL_PAID: { color: "bg-green-100 text-green-700 border-green-200", label: "Paid", icon: CheckCircle },
  FAILED: { color: "bg-red-100 text-red-700 border-red-200", label: "Failed", icon: XCircle },
  REFUNDED: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Refunded", icon: XCircle },
};

const accessConfig: Record<string, { color: string; label: string }> = {
  NONE: { color: "bg-gray-100 text-gray-600", label: "No Access" },
  PRE_ARRIVAL: { color: "bg-blue-100 text-blue-700", label: "Pre-Arrival" },
  FULL: { color: "bg-green-100 text-green-700", label: "Full Access" },
  ALUMNI: { color: "bg-amber-100 text-amber-700", label: "Alumni" },
};

const ITEMS_PER_PAGE = 15;

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/enrollments?limit=100", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch enrollments");
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch enrollments");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEnrollments();
  }, []);

  const filteredEnrollments = enrollments.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.courseSlug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const paginatedEnrollments = filteredEnrollments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter(e => e.paymentStatus === "PENDING").length,
    depositPaid: enrollments.filter(e => e.paymentStatus === "DEPOSIT_PAID").length,
    paid: enrollments.filter(e => e.paymentStatus === "FULL_PAID").length,
    revenue: enrollments
      .filter(e => e.paymentStatus === "FULL_PAID")
      .reduce((sum, e) => sum + e.amount, 0),
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

  const exportEnrollments = () => {
    const columns = ["Name", "Email", "Phone", "Course", "Batch", "Payment", "Access", "Amount", "Currency", "Created"];
    const rows = filteredEnrollments.map((enrollment) => [
      enrollment.name,
      enrollment.email,
      enrollment.phone || "",
      enrollment.courseSlug,
      enrollment.batch?.name || "",
      paymentConfig[enrollment.paymentStatus]?.label || enrollment.paymentStatus,
      accessConfig[enrollment.accessLevel]?.label || enrollment.accessLevel,
      enrollment.amount,
      enrollment.currency,
      formatDate(enrollment.createdAt),
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage course enrollments and payments</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => void fetchEnrollments()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportEnrollments} disabled={filteredEnrollments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("PENDING")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("DEPOSIT_PAID")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.depositPaid}</p>
                  <p className="text-sm text-gray-500">Deposit Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or course..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="DEPOSIT_PAID">Deposit Paid</option>
                <option value="FULL_PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              {(statusFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStatusFilter("all"); setSearch(""); setPage(1); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {paginatedEnrollments.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No enrollments found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Student</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Course</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Payment</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Access</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEnrollments.map((enrollment) => {
                        const payment = paymentConfig[enrollment.paymentStatus] || paymentConfig.PENDING;
                        const access = accessConfig[enrollment.accessLevel] || accessConfig.NONE;
                        const PaymentIcon = payment.icon;

                        return (
                          <tr key={enrollment.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                  {enrollment.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{enrollment.name}</p>
                                  <p className="text-xs text-gray-500">{enrollment.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium text-gray-900 uppercase">{enrollment.courseSlug}</p>
                              {enrollment.batch && (
                                <p className="text-xs text-gray-500">{enrollment.batch.name}</p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={payment.color + " gap-1"}>
                                <PaymentIcon className="h-3 w-3" />
                                {payment.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={access.color}>
                                {access.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(enrollment.amount, enrollment.currency)}
                              </p>
                              {enrollment.payments?.[0] && (
                                <p className="text-xs text-gray-400">
                                  Paid: {formatCurrency(
                                    enrollment.payments.filter(p => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
                                    enrollment.currency
                                  )}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{formatDate(enrollment.createdAt)}</p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEnrollment(enrollment)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={`mailto:${enrollment.email}`} aria-label={`Email ${enrollment.name}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedEnrollment(enrollment)} title="Open access details">
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredEnrollments.length)} of {filteredEnrollments.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                  {selectedEnrollment.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEnrollment.name}</h3>
                  <p className="text-gray-500">{selectedEnrollment.email}</p>
                  <p className="text-sm text-gray-400">{selectedEnrollment.phone}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge className={paymentConfig[selectedEnrollment.paymentStatus]?.color}>
                  {paymentConfig[selectedEnrollment.paymentStatus]?.label}
                </Badge>
                <Badge className={accessConfig[selectedEnrollment.accessLevel]?.color}>
                  {accessConfig[selectedEnrollment.accessLevel]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium text-gray-900 uppercase">{selectedEnrollment.courseSlug}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium text-gray-900">{selectedEnrollment.batch?.name || "Not assigned"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedEnrollment.amount, selectedEnrollment.currency)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Enrolled On</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedEnrollment.createdAt)}</p>
                </div>
              </div>

              {selectedEnrollment.payments && selectedEnrollment.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {selectedEnrollment.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{payment.method.replace("_", " ")}</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                          <Badge className={payment.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedEnrollment.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                <Button variant="outline" disabled title="Use Students page to change access level">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Access
                </Button>
                <Button disabled title="Payment confirmation must come from payment gateway webhook or finance tools">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
