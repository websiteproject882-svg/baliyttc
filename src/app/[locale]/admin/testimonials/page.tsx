"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Star, CheckCircle, XCircle, Clock, Search, Filter,
  ChevronLeft, ChevronRight, Eye, Edit, Trash2, Quote,
  MapPin, Calendar, MessageSquare, Loader2, Plus, Image
} from "lucide-react";

interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  location: string | null;
  courseName: string | null;
  graduationYear: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

const statusConfig = {
  PENDING: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending Review", icon: Clock },
  APPROVED: { color: "bg-green-100 text-green-700 border-green-200", label: "Approved", icon: CheckCircle },
  REJECTED: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected", icon: XCircle },
};

const ITEMS_PER_PAGE = 12;

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [viewTestimonial, setViewTestimonial] = useState<Testimonial | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/testimonials");
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
      // Demo data
      setTestimonials([
        { id: "1", rating: 5, quote: "This training changed my life! The teachers were incredibly knowledgeable and the Bali setting was magical. I've now been teaching yoga for 6 months and love every moment of it.", location: "Berlin, Germany", courseName: "200hr YTTC", graduationYear: 2026, status: "APPROVED", approvedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), student: { id: "s1", name: "Sarah Johnson", email: "sarah@example.com" } },
        { id: "2", rating: 5, quote: "Best decision I ever made. The curriculum was comprehensive and the hands-on teaching practice gave me the confidence to start my own classes right after graduation.", location: "London, UK", courseName: "200hr YTTC", graduationYear: 2026, status: "PENDING", approvedAt: null, createdAt: new Date().toISOString(), student: { id: "s2", name: "Emma Wilson", email: "emma@example.com" } },
        { id: "3", rating: 4, quote: "Amazing experience overall. The only reason for 4 stars is that the accommodation was a bit basic, but the training itself was top-notch.", location: "Amsterdam, Netherlands", courseName: "300hr YTTC", graduationYear: 2025, status: "APPROVED", approvedAt: new Date(Date.now() - 2592000000).toISOString(), createdAt: new Date(Date.now() - 2592000000).toISOString(), student: { id: "s3", name: "James Miller", email: "james@example.com" } },
        { id: "4", rating: 5, quote: "From the moment I arrived, I felt welcomed. TheBalinese culture, the yoga practice, the fellow students - everything was perfect. Highly recommend!", location: "Sydney, Australia", courseName: "200hr YTTC", graduationYear: 2026, status: "PENDING", approvedAt: null, createdAt: new Date().toISOString(), student: { id: "s4", name: "Anna Mueller", email: "anna@example.com" } },
        { id: "5", rating: 3, quote: "Good training but found some aspects too intensive. The meditation sessions were the highlight for me.", location: "Paris, France", courseName: "100hr YTTC", graduationYear: 2026, status: "REJECTED", approvedAt: null, createdAt: new Date(Date.now() - 172800000).toISOString(), student: { id: "s5", name: "Pierre Dubois", email: "pierre@example.com" } },
        { id: "6", rating: 5, quote: "Transformed my practice completely. The philosophy teachings opened my eyes to a whole new understanding of yoga. Forever grateful!", location: "Toronto, Canada", courseName: "300hr YTTC", graduationYear: 2026, status: "APPROVED", approvedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), student: { id: "s6", name: "Michael Chen", email: "michael@example.com" } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTestimonials();
  }, []);

  const filteredTestimonials = testimonials.filter(t => {
    const matchSearch = !search ||
      t.quote.toLowerCase().includes(search.toLowerCase()) ||
      t.student.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.courseName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE);
  const paginatedTestimonials = filteredTestimonials.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => t.status === "PENDING").length,
    approved: testimonials.filter(t => t.status === "APPROVED").length,
    rejected: testimonials.filter(t => t.status === "REJECTED").length,
    avgRating: testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : "0",
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED" }),
      });
      await fetchTestimonials();
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "REJECTED" }),
      });
      await fetchTestimonials();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
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
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
            <p className="text-sm text-gray-500 mt-1">Manage student testimonials and reviews</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Quote className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "PENDING" ? "ring-2 ring-amber-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "PENDING" ? "all" : "PENDING")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "APPROVED" ? "ring-2 ring-green-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "APPROVED" ? "all" : "APPROVED")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "REJECTED" ? "ring-2 ring-red-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "REJECTED" ? "all" : "REJECTED")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-sm text-gray-500">Avg Rating</p>
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
                    placeholder="Search testimonials..."
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
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
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

        {/* Testimonials Grid */}
        {paginatedTestimonials.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Quote className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No testimonials found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTestimonials.map((testimonial) => {
                const status = statusConfig[testimonial.status];
                const StatusIcon = status.icon;
                return (
                  <Card key={testimonial.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {testimonial.student.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{testimonial.student.name}</p>
                            <p className="text-sm text-gray-500">{testimonial.student.email}</p>
                          </div>
                        </div>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {renderStars(testimonial.rating)}
                      </div>

                      {/* Quote */}
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm line-clamp-4">{testimonial.quote}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {testimonial.courseName && (
                          <Badge variant="outline" className="text-xs">
                            {testimonial.courseName}
                          </Badge>
                        )}
                        {testimonial.location && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {testimonial.location}
                          </Badge>
                        )}
                        {testimonial.graduationYear && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {testimonial.graduationYear}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewTestimonial(testimonial)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {testimonial.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-green-600 hover:text-green-700"
                              onClick={() => void handleApprove(testimonial.id)}
                              disabled={actionLoading === testimonial.id}
                            >
                              {actionLoading === testimonial.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-red-600 hover:text-red-700"
                              onClick={() => void handleReject(testimonial.id)}
                              disabled={actionLoading === testimonial.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredTestimonials.length)} of {filteredTestimonials.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewTestimonial} onOpenChange={() => setViewTestimonial(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Testimonial Details</DialogTitle>
          </DialogHeader>
          {viewTestimonial && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                  {viewTestimonial.student.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "S"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewTestimonial.student.name}</h3>
                  <p className="text-gray-500">{viewTestimonial.student.email}</p>
                  <Badge className={`mt-2 ${statusConfig[viewTestimonial.status].color}`}>
                    {statusConfig[viewTestimonial.status].label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {renderStars(viewTestimonial.rating)}
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <Quote className="h-6 w-6 text-orange-400 mb-2" />
                <p className="text-gray-700 text-lg italic">"{viewTestimonial.quote}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Course</p>
                  <p className="font-medium text-gray-900">{viewTestimonial.courseName || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Graduation Year</p>
                  <p className="font-medium text-gray-900">{viewTestimonial.graduationYear || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900">{viewTestimonial.location || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Submitted</p>
                  <p className="font-medium text-gray-900">{formatDate(viewTestimonial.createdAt)}</p>
                </div>
              </div>

              <DialogFooter>
                {viewTestimonial.status === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600"
                      onClick={() => { void handleReject(viewTestimonial.id); setViewTestimonial(null); }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => { void handleApprove(viewTestimonial.id); setViewTestimonial(null); }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                {viewTestimonial.status !== "PENDING" && (
                  <Button variant="outline" onClick={() => setViewTestimonial(null)}>Close</Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
