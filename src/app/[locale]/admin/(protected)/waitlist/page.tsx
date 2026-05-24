"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Clock, CheckCircle, XCircle, AlertCircle, Search,
  Mail, Phone, Globe, Calendar, ArrowRight, Loader2, Send
} from "lucide-react";

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  courseSlug: string;
  batchId: string | null;
  status: "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED" | "DECLINED";
  priority: number;
  notes: string | null;
  createdAt: string;
  notifiedAt: string | null;
  convertedAt: string | null;
}

interface CourseOption {
  id: string;
  name: string;
  slug: string;
}

const statusConfig = {
  WAITING: { color: "bg-amber-100 text-amber-800", icon: Clock, label: "Waiting" },
  NOTIFIED: { color: "bg-blue-100 text-blue-800", icon: AlertCircle, label: "Notified" },
  CONVERTED: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Converted" },
  EXPIRED: { color: "bg-gray-100 text-gray-600", icon: XCircle, label: "Expired" },
  DECLINED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Declined" },
};

export default function WaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [waitlistRes, coursesRes] = await Promise.all([
        fetch("/api/admin/waitlist", { cache: "no-store" }),
        fetch("/api/admin/courses", { cache: "no-store" }),
      ]);
      const [waitlistData, coursesData] = await Promise.all([
        waitlistRes.json(),
        coursesRes.json(),
      ]);
      if (!waitlistRes.ok) throw new Error(waitlistData.error || "Failed to fetch waitlist");
      if (!coursesRes.ok) throw new Error(coursesData.error || "Failed to fetch courses");
      setWaitlist(waitlistData.waitlist || []);
      setCourses(coursesData.courses || []);
    } catch (err) {
      console.error("Failed to fetch waitlist:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const updateStatus = async (entry: WaitlistEntry, status: WaitlistEntry["status"]) => {
    const response = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update waitlist entry");
    await fetchData();
  };

  const handleNotify = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setNotifyDialogOpen(true);
  };

  const sendNotification = async () => {
    if (!selectedEntry) return;
    setSending(true);
    setError(null);
    try {
      await updateStatus(selectedEntry, "NOTIFIED");
      setNotifyDialogOpen(false);
    } catch (err) {
      console.error("Failed to notify waitlist entry:", err);
      setError(err instanceof Error ? err.message : "Failed to notify waitlist entry");
    } finally {
      setSending(false);
    }
  };

  const handleConvert = async (entry: WaitlistEntry) => {
    if (!confirm(`Convert ${entry.name} to enrollment?`)) return;
    setError(null);
    try {
      await updateStatus(entry, "CONVERTED");
    } catch (err) {
      console.error("Failed to convert waitlist entry:", err);
      setError(err instanceof Error ? err.message : "Failed to convert waitlist entry");
    }
  };

  const handleDecline = async (entry: WaitlistEntry) => {
    if (!confirm(`Decline ${entry.name}'s waitlist application?`)) return;
    setError(null);
    try {
      await updateStatus(entry, "DECLINED");
    } catch (err) {
      console.error("Failed to decline waitlist entry:", err);
      setError(err instanceof Error ? err.message : "Failed to decline waitlist entry");
    }
  };

  const filteredWaitlist = waitlist.filter(w => {
    const matchSearch = !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || w.status === filterStatus;
    const matchCourse = filterCourse === "all" || w.courseSlug === filterCourse;
    return matchSearch && matchStatus && matchCourse;
  });

  const statusCounts = waitlist.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage students waiting for batch openings</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {waitlist.length} total entries
        </Badge>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = statusCounts[status] || 0;
          return (
            <Card key={status} className={`border-0 bg-white shadow-sm ${count === 0 ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-full p-2 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="all">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-0">
          {filteredWaitlist.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No waitlist entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Course</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.map((entry) => {
                    const status = statusConfig[entry.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                              {entry.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "W"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{entry.name}</p>
                              <p className="text-xs text-gray-500">{entry.email}</p>
                              {entry.phone && <p className="text-xs text-gray-400">{entry.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="text-xs uppercase">
                            {entry.courseSlug}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-sm font-medium ${entry.priority > 0 ? "text-amber-600" : "text-gray-500"}`}>
                            {entry.priority > 0 ? `Priority ${entry.priority}` : "Normal"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {entry.status === "WAITING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleNotify(entry)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Notify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleConvert(entry)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Convert
                                </Button>
                              </>
                            )}
                            {entry.status === "WAITING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDecline(entry)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            )}
                          </div>
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

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Waitlist Student</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Send a notification to <strong>{selectedEntry.name}</strong> about a spot opening.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Email:</strong> {selectedEntry.email}</p>
                  <p className="text-sm"><strong>Course:</strong> {selectedEntry.courseSlug}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void sendNotification()} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
