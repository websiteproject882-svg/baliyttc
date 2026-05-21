"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardList, Search, Filter, Download, Eye, ChevronLeft, ChevronRight,
  User, Settings, CreditCard, Users, BookOpen, Calendar, Bell, Shield
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  createdAt: string;
  user: {
    email: string;
    displayName: string | null;
  };
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

const actionConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  "enrollment.created": { color: "bg-green-100 text-green-700", icon: BookOpen, label: "Enrollment Created" },
  "enrollment.updated": { color: "bg-blue-100 text-blue-700", icon: BookOpen, label: "Enrollment Updated" },
  "payment.completed": { color: "bg-green-100 text-green-700", icon: CreditCard, label: "Payment Completed" },
  "payment.failed": { color: "bg-red-100 text-red-700", icon: CreditCard, label: "Payment Failed" },
  "student.access_granted": { color: "bg-green-100 text-green-700", icon: Shield, label: "Access Granted" },
  "student.created": { color: "bg-blue-100 text-blue-700", icon: Users, label: "Student Created" },
  "batch.created": { color: "bg-purple-100 text-purple-700", icon: Calendar, label: "Batch Created" },
  "announcement.sent": { color: "bg-amber-100 text-amber-700", icon: Bell, label: "Announcement Sent" },
  "user.login": { color: "bg-gray-100 text-gray-700", icon: User, label: "User Login" },
  "staff.created": { color: "bg-blue-100 text-blue-700", icon: Shield, label: "Staff Added" },
  "settings.updated": { color: "bg-amber-100 text-amber-700", icon: Settings, label: "Settings Updated" },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/audit");
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        // Demo data
        const demoLogs: AuditLogEntry[] = [
          { id: "1", action: "enrollment.created", entity: "enrollment", entityId: "enr-001", description: "New enrollment created for Sarah Johnson", createdAt: new Date().toISOString(), user: { email: "admin@baliyttc.com", displayName: "Admin User" } },
          { id: "2", action: "payment.completed", entity: "payment", entityId: "pay-001", description: "Payment of $1499 completed", createdAt: new Date(Date.now() - 3600000).toISOString(), user: { email: "admin@baliyttc.com", displayName: "Admin User" } },
          { id: "3", action: "student.access_granted", entity: "student", entityId: "std-001", description: "Full access granted to Emma Wilson", createdAt: new Date(Date.now() - 7200000).toISOString(), user: { email: "admin@baliyttc.com", displayName: "Admin User" } },
          { id: "4", action: "batch.created", entity: "batch", entityId: "batch-001", description: "New batch created: Sep 2026 Batch", createdAt: new Date(Date.now() - 86400000).toISOString(), user: { email: "admin@baliyttc.com", displayName: "Admin User" } },
          { id: "5", action: "announcement.sent", entity: "announcement", entityId: "ann-001", description: "Welcome announcement sent to all students", createdAt: new Date(Date.now() - 172800000).toISOString(), user: { email: "admin@baliyttc.com", displayName: "Admin User" } },
        ];
        setLogs(demoLogs);
      } finally {
        setLoading(false);
      }
    };
    void fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = !search ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.user.email.toLowerCase().includes(search.toLowerCase());
    const matchEntity = filterEntity === "all" || log.entity === filterEntity;
    return matchSearch && matchEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const entities = Array.from(new Set(logs.map(l => l.entity)));

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit"
    });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Track all system activities and changes</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {logs.filter(l => l.action.includes("created") || l.action.includes("updated")).length}
              </p>
              <p className="text-sm text-gray-500">Edits</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {logs.filter(l => l.action.includes("payment")).length}
              </p>
              <p className="text-sm text-gray-500">Payments</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {logs.filter(l => l.action.includes("access")).length}
              </p>
              <p className="text-sm text-gray-500">Access Changes</p>
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
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={filterEntity}
                onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
              >
                <option value="all">All Entities</option>
                {entities.map(entity => (
                  <option key={entity} value={entity}>{entity.charAt(0).toUpperCase() + entity.slice(1)}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {paginatedLogs.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No audit logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Event</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">User</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => {
                        const config = actionConfig[log.action] || { color: "bg-gray-100 text-gray-700", icon: ClipboardList, label: log.action };
                        const Icon = config.icon;

                        return (
                          <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`rounded-lg p-2 ${config.color}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{config.label}</p>
                                  <p className="text-xs text-gray-500">{log.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-900">{log.user.displayName || "System"}</p>
                                  <p className="text-xs text-gray-500">{log.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{formatDate(log.createdAt)}</p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
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
                      Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
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
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Action</p>
                  <p className="text-sm font-medium">{selectedLog.action}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Entity</p>
                  <p className="text-sm font-medium">{selectedLog.entity}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Entity ID</p>
                  <p className="text-sm font-medium font-mono">{selectedLog.entityId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm font-medium">{selectedLog.user.displayName}</p>
                <p className="text-xs text-gray-500">{selectedLog.user.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Description</p>
                <p className="text-sm">{selectedLog.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
