"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, CheckCircle, Trash2, CheckCheck, Info, AlertTriangle, Wrench } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION";
  audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE" | "INDIVIDUAL";
  actionUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const typeConfig = {
  INFO: { color: "bg-blue-100 text-blue-700", label: "Info", icon: Info },
  SUCCESS: { color: "bg-green-100 text-green-700", label: "Success", icon: CheckCircle },
  WARNING: { color: "bg-amber-100 text-amber-700", label: "Warning", icon: AlertTriangle },
  ACTION: { color: "bg-purple-100 text-purple-700", label: "Action", icon: Wrench },
} as const;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "recent">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/notifications");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  const deleteNotification = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete notification");
      }
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setError(err instanceof Error ? err.message : "Failed to delete notification");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    const publishedTime = new Date(notification.publishedAt || notification.createdAt).getTime();
    return Date.now() - publishedTime < 1000 * 60 * 60 * 24 * 7;
  });

  const recentCount = notifications.filter((notification) => {
    const publishedTime = new Date(notification.publishedAt || notification.createdAt).getTime();
    return Date.now() - publishedTime < 1000 * 60 * 60 * 24 * 7;
  }).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading && notifications.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {notifications.length > 0 ? `${notifications.length} notifications in system` : "No notifications yet"}
            </p>
          </div>
          <Button variant="outline" onClick={() => void fetchNotifications()}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                All
              </Button>
              <Button variant={filter === "recent" ? "default" : "outline"} size="sm" onClick={() => setFilter("recent")}>
                <Bell className="h-4 w-4 mr-1" />
                Recent ({recentCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const type = typeConfig[notification.type];
                  const TypeIcon = type.icon;
                  return (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                          <TypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            <Badge className={type.color} variant="outline">
                              {type.label}
                            </Badge>
                            <Badge variant="outline">{notification.audience}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notification.publishedAt || notification.createdAt)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === notification.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Badge className={typeConfig[selectedNotification.type].color}>{typeConfig[selectedNotification.type].label}</Badge>
                <Badge variant="outline">{selectedNotification.audience}</Badge>
              </div>
              <p className="text-gray-600">{selectedNotification.message}</p>
              {selectedNotification.actionUrl && (
                <p className="text-sm text-blue-600 break-all">{selectedNotification.actionUrl}</p>
              )}
              <p className="text-sm text-gray-400">
                {new Date(selectedNotification.publishedAt || selectedNotification.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
