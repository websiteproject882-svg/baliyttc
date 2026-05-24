"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Clock, AlertTriangle, CheckCircle, XCircle,
  Send, ToggleLeft, ToggleRight, Bell, RefreshCw, Eye
} from "lucide-react";

interface ReminderSettings {
  enabled: boolean;
  reminder1Hours: number;
  reminder2Hours: number;
  reminder3Days: number;
  emailTemplates: {
    reminder1: string;
    reminder2: string;
    reminder3: string;
  };
}

const defaultSettings: ReminderSettings = {
  enabled: false,
  reminder1Hours: 1,
  reminder2Hours: 24,
  reminder3Days: 3,
  emailTemplates: {
    reminder1: "Hey {{name}}! Just a reminder - you started enrolling for {{course}} but didn't finish. Complete your enrollment here: {{link}}",
    reminder2: "Hi {{name}}, it's been 24 hours since you started your enrollment for {{course}}. Your spot is waiting! Complete it here: {{link}}",
    reminder3: "Hi {{name}}, we noticed you were interested in our {{course}} program. There's still time to join! Limited spots available: {{link}}",
  },
};

interface AbandonedEnrollment {
  id: string;
  name: string;
  email: string;
  courseSlug: string;
  lastActivity: string;
  remindersSent: number;
  status: "pending" | "converted" | "lost";
}

export default function AbandonedEnrollmentPage() {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [abandonedList, setAbandonedList] = useState<AbandonedEnrollment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchAbandoned = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/abandoned", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch abandoned enrollments");
      }
      setSettings(data.settings || defaultSettings);
      setAbandonedList(Array.isArray(data.abandoned) ? data.abandoned : []);
    } catch (err) {
      console.error("Failed to fetch abandoned enrollments:", err);
      setAbandonedList([]);
      setError(err instanceof Error ? err.message : "Failed to fetch abandoned enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAbandoned();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/abandoned", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save abandoned settings:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendManual = async (id: string) => {
    setSendingId(id);
    setError(null);
    try {
      const response = await fetch("/api/admin/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reminder");
      }
      await fetchAbandoned();
    } catch (err) {
      console.error("Failed to send abandoned reminder:", err);
      setError(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setSendingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Abandoned Enrollment</h1>
            <p className="text-sm text-gray-500 mt-1">Auto email reminders for incomplete enrollments</p>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Enable/Disable */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  settings.enabled ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {settings.enabled ? (
                    <Bell className="h-6 w-6 text-green-600" />
                  ) : (
                    <Bell className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Abandoned Enrollment Reminders</h3>
                  <p className="text-sm text-gray-500">Send automatic reminders to incomplete enrollments</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.enabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? "translate-x-7" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {settings.enabled && (
          <>
            {/* Reminder Timing */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Reminder Timing</CardTitle>
                <CardDescription>Set when to send follow-up emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="font-medium">Reminder 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">After</span>
                      <Input
                        type="number"
                        className="w-20"
                        value={settings.reminder1Hours}
                        onChange={(e) => setSettings({ ...settings, reminder1Hours: parseInt(e.target.value) || 1 })}
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">Reminder 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">After</span>
                      <Input
                        type="number"
                        className="w-20"
                        value={settings.reminder2Hours}
                        onChange={(e) => setSettings({ ...settings, reminder2Hours: parseInt(e.target.value) || 24 })}
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">Reminder 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">After</span>
                      <Input
                        type="number"
                        className="w-20"
                        value={settings.reminder3Days}
                        onChange={(e) => setSettings({ ...settings, reminder3Days: parseInt(e.target.value) || 3 })}
                      />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Customize reminder emails (use {"{{name}}"}, {"{{course}}"}, {"{{link}}"} as variables)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reminder 1 Email ({settings.reminder1Hours}h)
                  </label>
                  <textarea
                    className="w-full rounded-lg border p-3 min-h-[80px]"
                    value={settings.emailTemplates.reminder1}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailTemplates: { ...settings.emailTemplates, reminder1: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reminder 2 Email ({settings.reminder2Hours}h)
                  </label>
                  <textarea
                    className="w-full rounded-lg border p-3 min-h-[80px]"
                    value={settings.emailTemplates.reminder2}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailTemplates: { ...settings.emailTemplates, reminder2: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reminder 3 Email ({settings.reminder3Days}d)
                  </label>
                  <textarea
                    className="w-full rounded-lg border p-3 min-h-[80px]"
                    value={settings.emailTemplates.reminder3}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailTemplates: { ...settings.emailTemplates, reminder3: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Abandoned */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Abandoned Enrollments</CardTitle>
            <CardDescription>Students who started but didn't complete enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto text-gray-300 mb-4 animate-spin" />
                <p className="text-gray-500">Loading abandoned enrollments...</p>
              </div>
            ) : abandonedList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p className="text-gray-500">No abandoned enrollments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {abandonedList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                        {item.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium uppercase">{item.courseSlug}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(item.lastActivity)}</p>
                      </div>
                      <Badge className={
                        item.status === "converted" ? "bg-green-100 text-green-700" :
                        item.status === "lost" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }>
                        {item.status}
                      </Badge>
                      <Button variant="outline" size="sm" disabled={sendingId === item.id} onClick={() => void handleSendManual(item.id)}>
                        <Mail className="h-4 w-4 mr-2" />
                        {sendingId === item.id ? "Sending..." : "Send Manual"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
