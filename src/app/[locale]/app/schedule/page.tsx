"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    void fetch("/api/app/portal")
      .then((response) => response.json())
      .then((result) => setSchedule(result.schedule || []))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="mt-1 text-sm text-gray-500">Weekly and daily class plan with teacher, time, yoga style, and room.</p>
      </div>
      <div className="grid gap-4">
        {schedule.length === 0 ? (
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
                    Classes are blocked for a Balinese ceremony. Admin can add ceremony notes for this date.
                  </div>
                ) : null}
                {entry.activities.map((activity, index) => {
                  const teacher = activity.teacher || entry.teacher?.name || "Teacher TBD";
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
