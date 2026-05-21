"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bell, CheckCircle, Clock, Trash2, Eye, Filter, CheckCheck
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "PAYMENT" | "ENROLLMENT" | "ANNOUNCEMENT" | "SYSTEM" | "LEAD";
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const typeConfig = {
  PAYMENT: { color: "bg-green-100 text-green-700", label: "Payment" },
  ENROLLMENT: { color: "bg-blue-100 text-blue-700", label: "Enrollment" },
  ANNOUNCEMENT: { color: "bg-purple-100 text-purple-700", label: "Announcement" },
  SYSTEM: { color: "bg-gray-100 text-gray-700", label: "System" },
  LEAD: { color: "bg-amber-100 text-amber-700", label: "Lead" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Load from localStorage for demo (in production, this would be from API)
    const saved = localStorage.getItem("baliyttc_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      // Demo data
      const demoData: Notification[] = [
        { id: "1", title: "New Enrollment", message: "Sarah Johnson enrolled in 200hr course.", type: "ENROLLMENT", isRead: false, createdAt: new Date().toISOString() },
        { id: "2", title: "Payment Received", message: "Michael Chen completed deposit payment of $300.", type: "PAYMENT", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "3", title: "New Lead", message: "Anna Mueller submitted an inquiry for 200hr course.", type: "LEAD", isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: "4", title: "Batch Starting Soon", message: "Mar 2026 Batch starts in 2 weeks.", type: "ANNOUNCEMENT", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setNotifications(demoData);
      localStorage.setItem("baliyttc_notifications", JSON.stringify(demoData));
    }
    setLoading(false);
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("baliyttc_notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem("baliyttc_notifications", JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("baliyttc_notifications", JSON.stringify(updated));
  };

  const filteredNotifications = notifications.filter(n =>
    filter === "all" || !n.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                <Bell className="h-4 w-4 mr-1" />
                Unread ({unreadCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
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
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => {
                        setSelectedNotification(notification);
                        if (!notification.isRead) markAsRead(notification.id);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.isRead ? "bg-gray-100" : "bg-blue-100"
                        }`}>
                          <Bell className={`h-5 w-5 ${
                            notification.isRead ? "text-gray-400" : "text-blue-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                              {notification.title}
                            </h3>
                            <Badge className={type.color} variant="outline">{type.label}</Badge>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              <Badge className={typeConfig[selectedNotification.type].color}>
                {typeConfig[selectedNotification.type].label}
              </Badge>
              <p className="text-gray-600">{selectedNotification.message}</p>
              <p className="text-sm text-gray-400">
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
