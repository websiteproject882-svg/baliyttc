"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Mail, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION";
  actionUrl: string | null;
  publishedAt: string | null;
  readAt: string | null;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState({
    emailNotificationsEnabled: true,
    browserPushEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferenceSaving, setPreferenceSaving] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/app/notifications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load notifications");
      }
      setItems(result.notifications || []);
      setPreferences((current) => result.preferences || current);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const updatePreference = async (key: "emailNotificationsEnabled" | "browserPushEnabled", value: boolean) => {
    setPreferenceSaving(key);
    setError(null);
    setPreferences((current) => ({ ...current, [key]: value }));
    try {
      const response = await fetch("/api/app/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to update notification preference");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update notification preference");
      setPreferences((current) => ({ ...current, [key]: !value }));
    } finally {
      setPreferenceSaving(null);
    }
  };

  const markRead = async (notificationId: string) => {
    setSavingId(notificationId);
    setError(null);
    try {
      const response = await fetch("/api/app/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to mark notification as read");
      }
      setItems((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item)),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to mark notification as read");
    } finally {
      setSavingId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAllRead(true);
    setError(null);
    try {
      const response = await fetch("/api/app/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to mark notifications as read");
      }
      const readAt = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to mark notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Important updates, actions, and arrival guidance.</p>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-4">
            <span className="flex items-center gap-3 text-sm font-medium text-gray-800">
              <Mail className="h-4 w-4 text-orange-500" />
              Email notifications
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-500"
              checked={preferences.emailNotificationsEnabled}
              disabled={preferenceSaving === "emailNotificationsEnabled"}
              onChange={(event) => updatePreference("emailNotificationsEnabled", event.target.checked)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-4">
            <span className="flex items-center gap-3 text-sm font-medium text-gray-800">
              <Smartphone className="h-4 w-4 text-orange-500" />
              Portal alert preference
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-500"
              checked={preferences.browserPushEnabled}
              disabled={preferenceSaving === "browserPushEnabled"}
              onChange={(event) => updatePreference("browserPushEnabled", event.target.checked)}
            />
          </label>
          <p className="text-xs leading-5 text-gray-500 md:col-span-2">
            These preferences are saved to your student profile and are used by the school team when sending portal and email updates.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-gray-500">Loading notifications...</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-gray-500">No notifications yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {unreadCount > 0 ? (
            <div className="flex justify-end">
              <Button variant="outline" onClick={markAllRead} disabled={markingAllRead}>
                {markingAllRead ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Mark all as read
              </Button>
            </div>
          ) : null}
          {items.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="mt-1 text-xs text-gray-500">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}</p>
                </div>
                <Badge className={item.readAt ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-800"}>
                  {item.readAt ? "read" : "unread"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-gray-700">{item.message}</p>
                <div className="flex gap-2">
                  {!item.readAt ? (
                    <Button variant="outline" onClick={() => markRead(item.id)} disabled={savingId === item.id}>
                      {savingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Mark as read
                    </Button>
                  ) : null}
                  {item.actionUrl ? (
                    <a href={item.actionUrl}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Bell className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
