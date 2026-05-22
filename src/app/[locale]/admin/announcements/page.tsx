"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
} from "lucide-react";

type AnnouncementType = "GENERAL" | "BATCH" | "URGENT";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  batchId?: string | null;
  createdAt: string;
  publishedAt: string | null;
}

const typeConfig: Record<
  AnnouncementType,
  { color: string; icon: typeof Bell; label: string; bgLight: string }
> = {
  GENERAL: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Bell, label: "General", bgLight: "bg-blue-50" },
  BATCH: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Calendar, label: "Batch", bgLight: "bg-purple-50" },
  URGENT: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, label: "Urgent", bgLight: "bg-red-50" },
};

const ITEMS_PER_PAGE = 10;

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "GENERAL" as AnnouncementType,
    batchId: "",
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/announcements", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch announcements");
      }
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setAnnouncements([]);
      setError(err instanceof Error ? err.message : "Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(
    () =>
      announcements.filter((announcement) => {
        const matchSearch =
          !search ||
          announcement.title.toLowerCase().includes(search.toLowerCase()) ||
          announcement.content.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || announcement.type === typeFilter;
        return matchSearch && matchType;
      }),
    [announcements, search, typeFilter],
  );

  const sortedAnnouncements = useMemo(
    () =>
      [...filteredAnnouncements].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filteredAnnouncements],
  );

  const totalPages = Math.max(1, Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE));
  const paginatedAnnouncements = sortedAnnouncements.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: announcements.length,
    sent: announcements.filter((item) => item.publishedAt).length,
    draft: announcements.filter((item) => !item.publishedAt).length,
    batchSpecific: announcements.filter((item) => item.batchId).length,
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatRelative = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${Math.max(diffMins, 0)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const resetForm = () =>
    setForm({
      title: "",
      content: "",
      type: "GENERAL",
      batchId: "",
    });

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      batchId: announcement.batchId || "",
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingAnnouncement(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: editingAnnouncement ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingAnnouncement ? { id: editingAnnouncement.id } : {}),
          title: form.title,
          content: form.content,
          type: form.type,
          batchId: form.batchId || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save announcement");
      }
      setDialogOpen(false);
      setEditingAnnouncement(null);
      resetForm();
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to save announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setActionLoading(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete announcement");
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to delete announcement");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage announcements for students</p>
          </div>
          <Button onClick={() => void handleNew()}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Edit className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                  <p className="text-sm text-gray-500">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.batchSpecific}</p>
                  <p className="text-sm text-gray-500">Batch Specific</p>
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
                    placeholder="Search announcements..."
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
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="GENERAL">General</option>
                <option value="BATCH">Batch</option>
                <option value="URGENT">Urgent</option>
              </select>
              {(typeFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all");
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

        {paginatedAnnouncements.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No announcements found</p>
              <Button variant="outline" className="mt-4" onClick={() => void handleNew()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedAnnouncements.map((announcement) => {
                const type = typeConfig[announcement.type];
                const TypeIcon = type.icon;
                return (
                  <Card key={announcement.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${type.bgLight} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`h-6 w-6 ${type.color.split(" ")[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{announcement.content}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`${type.color} gap-1`}>
                                  <TypeIcon className="h-3 w-3" />
                                  {type.label}
                                </Badge>
                                {announcement.batchId && <Badge variant="outline">Batch targeted</Badge>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-500">{formatRelative(announcement.createdAt)}</p>
                              <Badge
                                variant="outline"
                                className={`mt-2 ${announcement.publishedAt ? "text-green-600 border-green-200" : "text-gray-600"}`}
                              >
                                {announcement.publishedAt ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={() => setViewingAnnouncement(announcement)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <div className="flex-1" />
                            <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => void handleDelete(announcement.id)}
                              disabled={actionLoading === announcement.id}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, sortedAnnouncements.length)} of {sortedAnnouncements.length}
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
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <Input
                placeholder="Announcement title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
              <Textarea
                placeholder="Write your announcement..."
                className="min-h-[150px]"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })}
                >
                  <option value="GENERAL">General</option>
                  <option value="BATCH">Batch</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Batch ID</label>
                <Input
                  placeholder="Optional batch id"
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.title || !form.content}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAnnouncement ? "Save Changes" : "Create Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingAnnouncement} onOpenChange={() => setViewingAnnouncement(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Announcement Preview</DialogTitle>
          </DialogHeader>
          {viewingAnnouncement && (
            <div className="space-y-4 py-4">
              {(() => {
                const type = typeConfig[viewingAnnouncement.type];
                const TypeIcon = type.icon;
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge className={`${type.color} gap-1`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                      {viewingAnnouncement.batchId && <Badge variant="outline">Batch targeted</Badge>}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{viewingAnnouncement.title}</h3>
                    <div className={`p-4 rounded-xl ${type.bgLight}`}>
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingAnnouncement.content}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <span>Created: {formatDate(viewingAnnouncement.createdAt)}</span>
                      <span>{viewingAnnouncement.publishedAt ? `Published: ${formatDate(viewingAnnouncement.publishedAt)}` : "Draft"}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
