"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, Copy, Download, MapPin, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
  time: string;
  title: string;
  type?: string;
  teacher?: string;
  room?: string;
  style?: string;
};

type ScheduleEntry = {
  id: string;
  date: string;
  dayNumber: number;
  ceremonyBlocked?: boolean;
  activities: Activity[];
  notes?: string | null;
  teacher?: { name: string; role?: string | null; styles?: string[] } | null;
};

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void fetch("/api/app/portal", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load schedule");
        }
        return result;
      })
      .then((result) => setSchedule(result.schedule || []))
      .catch((error) => setError(error instanceof Error ? error.message : "Failed to load schedule"))
      .finally(() => setLoading(false));
  }, []);

  const makeScheduleSummary = () =>
    schedule
      .map((entry) => {
        const date = new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const activities = entry.activities
          .map((activity) => `${activity.time} - ${activity.title}`)
          .join("; ");
        return `Day ${entry.dayNumber} (${date}): ${entry.ceremonyBlocked ? "Balinese ceremony / no class" : activities || "Schedule details pending"}`;
      })
      .join("\n");

  const copySchedule = async () => {
    try {
      await navigator.clipboard.writeText(makeScheduleSummary());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy schedule. Please try again.");
    }
  };

  const exportCalendar = () => {
    const formatDate = (value: string) => {
      const date = new Date(value);
      return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
    };
    const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
    const events = schedule.map((entry) => {
      const start = formatDate(entry.date);
      const endDate = new Date(entry.date);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      const end = formatDate(endDate.toISOString());
      const summary = entry.ceremonyBlocked ? `Bali YTTC Day ${entry.dayNumber}: Ceremony Day` : `Bali YTTC Day ${entry.dayNumber}`;
      const description = entry.ceremonyBlocked
        ? entry.notes || "Balinese ceremony day. Check your student portal for details."
        : entry.activities.map((activity) => `${activity.time} - ${activity.title}`).join("\\n");
      return [
        "BEGIN:VEVENT",
        `UID:${entry.id}@baliyttc`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(description || "Training schedule details in student portal.")}`,
        "END:VEVENT",
      ].join("\r\n");
    });
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bali YTTC//Student Schedule//EN", ...events, "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bali-yttc-schedule.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">Weekly and daily class plan with teacher, time, yoga style, and room.</p>
        </div>
        {schedule.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={copySchedule}>
              {copied ? <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy summary"}
            </Button>
            <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={exportCalendar}>
              <Download className="mr-2 h-4 w-4" />
              Export calendar
            </Button>
          </div>
        ) : null}
      </div>
      {error && (
        <Card className="mb-4 border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}
      <div className="grid gap-4">
        {loading ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-gray-500">Loading schedule...</CardContent>
          </Card>
        ) : schedule.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-gray-500">Schedule unlocks after your batch timetable is published.</CardContent>
          </Card>
        ) : (
          schedule.map((entry) => (
            <Card key={entry.id} className="border-0 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Day {entry.dayNumber} - {new Date(entry.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </CardTitle>
                  {entry.ceremonyBlocked ? (
                    <Badge className="w-fit bg-amber-100 text-amber-800">
                      Balinese ceremony - no class
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.ceremonyBlocked ? (
                  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    Classes are paused for a Balinese ceremony. Check the notes below for any meeting point or preparation guidance.
                  </div>
                ) : null}
                {entry.activities.map((activity, index) => {
                  const teacher = activity.teacher || entry.teacher?.name || "Teacher to be confirmed";
                  const style = activity.style || activity.type || entry.teacher?.styles?.[0] || "Yoga";
                  const room = activity.room || "Main Shala";

                  return (
                    <div key={`${entry.id}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="flex w-24 items-center gap-2 text-sm font-semibold text-gray-800">
                          <Clock className="h-4 w-4 text-orange-500" />
                          {activity.time}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {teacher}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              {style}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {room}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {entry.notes && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{entry.notes}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
