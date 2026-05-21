"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Mail, Eye, CheckCircle, Clock, Shield, Loader2,
  CreditCard, XCircle, Award, Download, Users, Filter,
  ChevronLeft, ChevronRight, GraduationCap, BookOpen, Calendar,
  DollarSign, MessageCircle, MoreVertical, Phone, Globe,
  Key, UserX, UserCheck, RefreshCw
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface EnrollmentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseSlug: string;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  paymentStatus: "PENDING" | "DEPOSIT_PAID" | "FULL_PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  batchId?: string | null;
  batch?: { name: string; startDate: string };
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
    certificates?: Array<{
      id: string;
      certificateId: string;
      status: string;
      issuedAt: string;
    }>;
  } | null;
}

const accessConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  NONE: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "No Access", icon: Clock },
  PRE_ARRIVAL: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Pre-Arrival", icon: Calendar },
  FULL: { color: "bg-green-100 text-green-700 border-green-200", label: "Full Access", icon: CheckCircle },
  ALUMNI: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Alumni", icon: Award },
};

const paymentConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  PENDING: { color: "bg-gray-100 text-gray-600", label: "Pending", icon: Clock },
  DEPOSIT_PAID: { color: "bg-blue-100 text-blue-700", label: "Deposit Paid", icon: CreditCard },
  FULL_PAID: { color: "bg-green-100 text-green-700", label: "Paid", icon: CheckCircle },
  FAILED: { color: "bg-red-100 text-red-700", label: "Failed", icon: XCircle },
  REFUNDED: { color: "bg-amber-100 text-amber-700", label: "Refunded", icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

export default function StudentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [viewDialog, setViewDialog] = useState<EnrollmentRow | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/enrollments?limit=100");
      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateAccess = async (enrollmentId: string, newAccess: string) => {
    try {
      const response = await fetch("/api/admin/students/access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, accessLevel: newAccess }),
      });
      if (response.ok) {
        await fetchEnrollments();
      }
    } catch (err) {
      console.error("Failed to update access:", err);
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
    const matchAccess = accessFilter === "all" || e.accessLevel === accessFilter;
    const matchPayment = paymentFilter === "all" || e.paymentStatus === paymentFilter;
    return matchSearch && matchAccess && matchPayment;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const paginatedEnrollments = filteredEnrollments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const stats = {
    total: enrollments.length,
    preArrival: enrollments.filter(e => e.accessLevel === "PRE_ARRIVAL").length,
    fullAccess: enrollments.filter(e => e.accessLevel === "FULL").length,
    alumni: enrollments.filter(e => e.accessLevel === "ALUMNI").length,
    pending: enrollments.filter(e => e.paymentStatus === "PENDING").length,
    paid: enrollments.filter(e => e.paymentStatus === "FULL_PAID").length,
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

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
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all enrolled students and their access</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-sm" onClick={() => setAccessFilter("all")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${accessFilter === "PRE_ARRIVAL" ? "ring-2 ring-blue-500" : ""}`} onClick={() => setAccessFilter(accessFilter === "PRE_ARRIVAL" ? "all" : "PRE_ARRIVAL")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-blue-600">{stats.preArrival}</p>
              <p className="text-sm text-gray-500">Pre-Arrival</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${accessFilter === "FULL" ? "ring-2 ring-green-500" : ""}`} onClick={() => setAccessFilter(accessFilter === "FULL" ? "all" : "FULL")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-green-600">{stats.fullAccess}</p>
              <p className="text-sm text-gray-500">Full Access</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${accessFilter === "ALUMNI" ? "ring-2 ring-amber-500" : ""}`} onClick={() => setAccessFilter(accessFilter === "ALUMNI" ? "all" : "ALUMNI")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-amber-600">{stats.alumni}</p>
              <p className="text-sm text-gray-500">Alumni</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${paymentFilter === "PENDING" ? "ring-2 ring-orange-500" : ""}`} onClick={() => setPaymentFilter(paymentFilter === "PENDING" ? "all" : "PENDING")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${paymentFilter === "FULL_PAID" ? "ring-2 ring-green-500" : ""}`} onClick={() => setPaymentFilter(paymentFilter === "FULL_PAID" ? "all" : "FULL_PAID")}>
            <CardContent className="p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-sm text-gray-500">Paid</p>
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
                value={accessFilter}
                onChange={(e) => { setAccessFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Access Levels</option>
                <option value="PRE_ARRIVAL">Pre-Arrival</option>
                <option value="FULL">Full Access</option>
                <option value="ALUMNI">Alumni</option>
                <option value="NONE">No Access</option>
              </select>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="DEPOSIT_PAID">Deposit Paid</option>
                <option value="FULL_PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              {(accessFilter !== "all" || paymentFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAccessFilter("all"); setPaymentFilter("all"); setSearch(""); setPage(1); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {paginatedEnrollments.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Student</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Course</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Access</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Payment</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Progress</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Enrolled</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEnrollments.map((enrollment) => {
                        const access = accessConfig[enrollment.accessLevel] || accessConfig.NONE;
                        const payment = paymentConfig[enrollment.paymentStatus] || paymentConfig.PENDING;
                        const AccessIcon = access.icon;
                        const PaymentIcon = payment.icon;
                        const progress = enrollment.student?.totalHours
                          ? Math.round((enrollment.student.completedHours / enrollment.student.totalHours) * 100)
                          : 0;

                        return (
                          <tr key={enrollment.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {enrollment.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{enrollment.name}</p>
                                  <p className="text-xs text-gray-500">{enrollment.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900 uppercase">{enrollment.courseSlug}</p>
                                {enrollment.batch && (
                                  <p className="text-xs text-gray-500">{enrollment.batch.name}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${access.color} gap-1`}>
                                <AccessIcon className="h-3 w-3" />
                                {access.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${payment.color} gap-1`}>
                                <PaymentIcon className="h-3 w-3" />
                                {payment.label}
                              </Badge>
                              {enrollment.payments?.[0] && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatCurrency(enrollment.payments[0].amount, enrollment.payments[0].currency)}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="w-24">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>{enrollment.student?.completedHours || 0}h</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{formatDate(enrollment.createdAt)}</p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Access Toggle */}
                                {enrollment.accessLevel === "NONE" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateAccess(enrollment.id, "PRE_ARRIVAL")}
                                    title="Grant Pre-Arrival Access"
                                  >
                                    <UserCheck className="h-4 w-4 text-blue-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateAccess(enrollment.id, "NONE")}
                                    title="Revoke Access"
                                  >
                                    <UserX className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewDialog(enrollment)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredEnrollments.length)} of {filteredEnrollments.length} students
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => (
                          <div key={p} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 px-1">...</span>}
                            <Button
                              variant={p === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(p)}
                              className="w-8 h-8"
                            >
                              {p}
                            </Button>
                          </div>
                        ))}
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

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {viewDialog.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewDialog.name}</h3>
                  <p className="text-gray-500">{viewDialog.email}</p>
                  {viewDialog.phone && <p className="text-sm text-gray-400">{viewDialog.phone}</p>}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-3">
                <Badge className={accessConfig[viewDialog.accessLevel]?.color}>
                  {accessConfig[viewDialog.accessLevel]?.label}
                </Badge>
                <Badge className={paymentConfig[viewDialog.paymentStatus]?.color}>
                  {paymentConfig[viewDialog.paymentStatus]?.label}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium text-gray-900 uppercase">{viewDialog.courseSlug}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="font-medium text-gray-900">{viewDialog.batch?.name || "Not assigned"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Enrolled On</p>
                  <p className="font-medium text-gray-900">{formatDate(viewDialog.createdAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="font-medium text-gray-900">
                    {viewDialog.student?.completedHours || 0} / {viewDialog.student?.totalHours || 0} hours
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {viewDialog.payments && viewDialog.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {viewDialog.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            payment.status === "SUCCESS" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}>
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{payment.method.replace("_", " ")}</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Access
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
