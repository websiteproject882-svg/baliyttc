"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Bell, Plus, Search, Edit, Trash2, Loader2, Send, Eye, Clock,
  AlertTriangle, CheckCircle, Users, Globe, Calendar, Mail,
  ChevronLeft, ChevronRight, Filter, Pin, PinOff
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "INFO" | "URGENT" | "SUCCESS" | "EVENT";
  audience: "ALL" | "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "STAFF";
  batchId?: string | null;
  batchName?: string | null;
  isPinned: boolean;
  createdAt: string;
  sentAt: string | null;
  readCount?: number;
}

const typeConfig = {
  INFO: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Bell, label: "Info", bgLight: "bg-blue-50" },
  URGENT: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, label: "Urgent", bgLight: "bg-red-50" },
  SUCCESS: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, label: "Success", bgLight: "bg-green-50" },
  EVENT: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Calendar, label: "Event", bgLight: "bg-purple-50" },
};

const audienceConfig = {
  ALL: { label: "All Users", color: "bg-gray-100 text-gray-700", icon: Globe },
  PRE_ARRIVAL: { label: "Pre-Arrival Students", color: "bg-blue-100 text-blue-700", icon: Calendar },
  FULL: { label: "Full Access Students", color: "bg-green-100 text-green-700", icon: Users },
  ALUMNI: { label: "Alumni", color: "bg-amber-100 text-amber-700", icon: Users },
  STAFF: { label: "Staff Only", color: "bg-purple-100 text-purple-700", icon: Users },
};

const ITEMS_PER_PAGE = 10;

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "INFO" as Announcement["type"],
    audience: "ALL" as Announcement["audience"],
    batchId: "",
    isPinned: false,
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/announcements");
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      // Demo data
      setAnnouncements([
        { id: "1", title: "Welcome to Bali YTTC 2026!", content: "We are excited to welcome our new batch of yoga teachers. This training will transform your practice and prepare you for a career in yoga.", type: "INFO", audience: "ALL", batchId: null, batchName: null, isPinned: true, createdAt: new Date().toISOString(), sentAt: new Date().toISOString(), readCount: 142 },
        { id: "2", title: "Schedule Change for March Batch", content: "Please note that the morning meditation session on March 15th has been moved to 5:30 AM. All students should arrive at the shala by 5:15 AM.", type: "URGENT", audience: "PRE_ARRIVAL", batchId: "b1", batchName: "March 2026", isPinned: false, createdAt: new Date(Date.now() - 86400000).toISOString(), sentAt: new Date(Date.now() - 86400000).toISOString(), readCount: 28 },
        { id: "3", title: "Graduation Ceremony Details", content: "The graduation ceremony will be held on the last Friday of your batch. Family members are welcome to attend. Dress code: Traditional Balinese attire encouraged.", type: "EVENT", audience: "ALL", batchId: null, batchName: null, isPinned: false, createdAt: new Date(Date.now() - 172800000).toISOString(), sentAt: new Date(Date.now() - 172800000).toISOString(), readCount: 156 },
        { id: "4", title: "New Menu Options Available", content: "We've added more vegetarian and vegan options to the dining menu. Please inform the kitchen staff of any dietary requirements.", type: "INFO", audience: "FULL", batchId: null, batchName: null, isPinned: false, createdAt: new Date(Date.now() - 259200000).toISOString(), sentAt: new Date(Date.now() - 259200000).toISOString(), readCount: 34 },
        { id: "5", title: "Early Bird Discount Extended!", content: "Good news! We've extended the early bird discount for the June batch. Book now and save $200 on your training fees.", type: "SUCCESS", audience: "ALL", batchId: null, batchName: null, isPinned: false, createdAt: new Date(Date.now() - 345600000).toISOString(), sentAt: new Date(Date.now() - 345600000).toISOString(), readCount: 189 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchAudience = audienceFilter === "all" || a.audience === audienceFilter;
    return matchSearch && matchType && matchAudience;
  });

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE);
  const paginatedAnnouncements = sortedAnnouncements.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: announcements.length,
    pinned: announcements.filter(a => a.isPinned).length,
    sent: announcements.filter(a => a.sentAt).length,
    draft: announcements.filter(a => !a.sentAt).length,
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const formatRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      audience: announcement.audience,
      batchId: announcement.batchId || "",
      isPinned: announcement.isPinned,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingAnnouncement(null);
    setForm({
      title: "",
      content: "",
      type: "INFO",
      audience: "ALL",
      batchId: "",
      isPinned: false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingAnnouncement
        ? `/api/admin/announcements?id=${editingAnnouncement.id}`
        : "/api/admin/announcements";
      const method = editingAnnouncement ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setDialogOpen(false);
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/announcements?action=send&id=${id}`, { method: "POST" });
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/announcements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPinned: !announcements.find(a => a.id === id)?.isPinned }),
      });
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && announcements.length === 0) {
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
        {/* Stats */}
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
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Pin className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pinned}</p>
                  <p className="text-sm text-gray-500">Pinned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  <p className="text-sm text-gray-500">Sent</p>
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
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search announcements..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Types</option>
                <option value="INFO">Info</option>
                <option value="URGENT">Urgent</option>
                <option value="SUCCESS">Success</option>
                <option value="EVENT">Event</option>
              </select>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={audienceFilter}
                onChange={(e) => { setAudienceFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Audiences</option>
                <option value="ALL">All Users</option>
                <option value="PRE_ARRIVAL">Pre-Arrival</option>
                <option value="FULL">Full Access</option>
                <option value="ALUMNI">Alumni</option>
                <option value="STAFF">Staff</option>
              </select>
              {(typeFilter !== "all" || audienceFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setTypeFilter("all"); setAudienceFilter("all"); setSearch(""); setPage(1); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
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
                const audience = audienceConfig[announcement.audience];
                const AudienceIcon = audience.icon;
                return (
                  <Card key={announcement.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Type Icon */}
                        <div className={`w-12 h-12 rounded-xl ${type.bgLight} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`h-6 w-6 ${type.color.split(" ")[1]}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {announcement.isPinned && (
                                  <Pin className="h-4 w-4 text-amber-600" />
                                )}
                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{announcement.content}</p>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`${type.color} gap-1`}>
                                  <TypeIcon className="h-3 w-3" />
                                  {type.label}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <AudienceIcon className="h-3 w-3" />
                                  {audience.label}
                                </Badge>
                                {announcement.batchName && (
                                  <Badge variant="outline" className="gap-1">
                                    {announcement.batchName}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-500">{formatRelative(announcement.createdAt)}</p>
                              {announcement.readCount !== undefined && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {announcement.readCount} reads
                                </p>
                              )}
                              {announcement.sentAt && (
                                <Badge variant="outline" className="mt-2 text-green-600 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={() => setViewingAnnouncement(announcement)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleTogglePin(announcement.id)}
                              disabled={actionLoading === announcement.id}
                            >
                              {announcement.isPinned ? (
                                <><PinOff className="h-4 w-4 mr-1" /> Unpin</>
                              ) : (
                                <><Pin className="h-4 w-4 mr-1" /> Pin</>
                              )}
                            </Button>
                            {!announcement.sentAt && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() => void handleSend(announcement.id)}
                                disabled={actionLoading === announcement.id}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send Now
                              </Button>
                            )}
                            <div className="flex-1" />
                            <Button variant="outline" size="sm" onClick={() => void handleEdit(announcement)}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, sortedAnnouncements.length)} of {sortedAnnouncements.length}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
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
                  onChange={(e) => setForm({ ...form, type: e.target.value as Announcement["type"] })}
                >
                  <option value="INFO">Info</option>
                  <option value="URGENT">Urgent</option>
                  <option value="SUCCESS">Success</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Audience</label>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as Announcement["audience"] })}
                >
                  <option value="ALL">All Users</option>
                  <option value="PRE_ARRIVAL">Pre-Arrival Students</option>
                  <option value="FULL">Full Access Students</option>
                  <option value="ALUMNI">Alumni</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isPinned" className="text-sm text-gray-700">Pin this announcement</label>
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

      {/* View Dialog */}
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
                const audience = audienceConfig[viewingAnnouncement.audience];
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge className={`${type.color} gap-1`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                      <Badge variant="outline">{audience.label}</Badge>
                      {viewingAnnouncement.isPinned && <Badge variant="outline"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{viewingAnnouncement.title}</h3>
                    <div className={`p-4 rounded-xl ${type.bgLight}`}>
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingAnnouncement.content}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <span>Created: {formatDate(viewingAnnouncement.createdAt)}</span>
                      {viewingAnnouncement.sentAt && <span>Sent: {formatDate(viewingAnnouncement.sentAt)}</span>}
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
