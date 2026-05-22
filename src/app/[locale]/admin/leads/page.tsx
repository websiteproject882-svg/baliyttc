"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Users,
  Loader2,
  Clock3,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  course: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "ENROLLED" | "NOT_INTERESTED" | "SPAM";
  notes: string | null;
  assignedTo: string | null;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  NEW: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "New", icon: Star },
  CONTACTED: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Contacted", icon: Phone },
  INTERESTED: { color: "bg-green-100 text-green-700 border-green-200", label: "Interested", icon: TrendingUp },
  ENROLLED: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Enrolled", icon: CheckCircle },
  NOT_INTERESTED: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "Not Interested", icon: XCircle },
  SPAM: { color: "bg-red-100 text-red-700 border-red-200", label: "Spam", icon: XCircle },
} as const;

const sourceLabels: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  referral: "Referral",
  website: "Website",
  whatsapp: "WhatsApp",
  other: "Other",
};

const ITEMS_PER_PAGE = 15;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    status: "NEW" as Lead["status"],
    notes: "",
    followUpAt: "",
    assignedTo: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/leads?limit=100", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setLeads([]);
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.course || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const paginatedLeads = filteredLeads.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: leads.length,
    new: leads.filter((lead) => lead.status === "NEW").length,
    interested: leads.filter((lead) => lead.status === "INTERESTED").length,
    enrolled: leads.filter((lead) => lead.status === "ENROLLED").length,
  };

  const sources = Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean)));

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditForm({
      status: lead.status,
      notes: lead.notes || "",
      followUpAt: lead.followUpAt?.split("T")[0] || "",
      assignedTo: lead.assignedTo || "",
    });
  };

  const handleSave = async () => {
    if (!editLead) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editLead.id,
          status: editForm.status,
          notes: editForm.notes,
          followUpAt: editForm.followUpAt || null,
          assignedTo: editForm.assignedTo || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update lead");
      }
      setEditLead(null);
      await fetchLeads();
    } catch (err) {
      console.error("Failed to update lead:", err);
      setError(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const exportLeads = () => {
    const columns = ["Name", "Email", "Phone", "Source", "Course", "Status", "Follow Up", "Created", "Notes"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "",
      sourceLabels[lead.source] || lead.source,
      lead.course || "",
      statusConfig[lead.status].label,
      lead.followUpAt ? formatDate(lead.followUpAt) : "",
      formatDate(lead.createdAt),
      lead.notes || "",
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const normalized = phone.replace(/[^\d]/g, "");
    if (!normalized) return;
    window.open(`https://wa.me/${normalized}`, "_blank", "noopener,noreferrer");
  };

  if (loading && leads.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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
            <h1 className="text-2xl font-bold text-gray-900">Leads & Inquiries</h1>
            <p className="text-sm text-gray-500 mt-1">Manage potential students and inquiries</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportLeads} disabled={filteredLeads.length === 0}>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "NEW" ? "ring-2 ring-blue-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "NEW" ? "all" : "NEW")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.new}</p>
                  <p className="text-sm text-gray-500">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "INTERESTED" ? "ring-2 ring-green-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "INTERESTED" ? "all" : "INTERESTED")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
                  <p className="text-sm text-gray-500">Interested</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "ENROLLED" ? "ring-2 ring-purple-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "ENROLLED" ? "all" : "ENROLLED")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.enrolled}</p>
                  <p className="text-sm text-gray-500">Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or course..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="SPAM">Spam</option>
              </select>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabels[source] || source}
                  </option>
                ))}
              </select>
              {(statusFilter !== "all" || sourceFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setSourceFilter("all");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {paginatedLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No leads found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Lead</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Contact</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Source</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Course</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.map((lead) => {
                        const status = statusConfig[lead.status];
                        const StatusIcon = status.icon;
                        return (
                          <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                  {lead.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "L"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{lead.name}</p>
                                  {lead.message && <p className="text-xs text-gray-500 truncate max-w-[200px]">{lead.message}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                                  {lead.email}
                                </p>
                                {lead.phone && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {lead.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline" className="capitalize">
                                {sourceLabels[lead.source] || lead.source}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium text-gray-900">{lead.course || "-"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${status.color} gap-1`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                              {lead.followUpAt && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <Clock3 className="h-3 w-3" />
                                  Follow up: {formatDate(lead.followUpAt)}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{formatDate(lead.createdAt)}</p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setViewLead(lead)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(lead)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={`mailto:${lead.email}`} aria-label={`Email ${lead.name}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openWhatsApp(lead.phone)}
                                  disabled={!lead.phone}
                                  aria-label={`Message ${lead.name}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
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
                      Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
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

      <Dialog open={!!viewLead} onOpenChange={() => setViewLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                  {viewLead.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "L"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewLead.name}</h3>
                  <Badge className={`mt-1 ${statusConfig[viewLead.status].color}`}>
                    {statusConfig[viewLead.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewLead.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewLead.phone || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Source</p>
                  <p className="text-sm font-medium text-gray-900">{sourceLabels[viewLead.source] || viewLead.source}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Course Interest</p>
                  <p className="text-sm font-medium text-gray-900">{viewLead.course || "-"}</p>
                </div>
              </div>

              {viewLead.message && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1">Message</p>
                  <p className="text-sm text-gray-900">{viewLead.message}</p>
                </div>
              )}

              {viewLead.notes && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{viewLead.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Lead["status"] })}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="SPAM">Spam</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Follow-up Date</label>
              <Input
                type="date"
                value={editForm.followUpAt}
                onChange={(e) => setEditForm({ ...editForm, followUpAt: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 min-h-[100px]"
                placeholder="Add notes about this lead..."
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
