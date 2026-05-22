"use client";
import { useState, useEffect } from "react";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Calendar, Users, FileText, Bell, MessageSquare,
  Clock, LogOut, ChevronRight, Video, BookOpen, Settings
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrolled: number;
  capacity: number;
  status: string;
  course: {
    name: string;
  };
}

interface ScheduleEntry {
  id: string;
  date: string;
  dayNumber: number;
  batch: Batch;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

export default function TeacherDashboardPage() {
  const params = useParams<{ locale: string }>();
  const { user, role, logout } = useAuth();
  const locale = params.locale || "en";
  const [data, setData] = useState<{
    upcomingBatches: Batch[];
    totalStudents: number;
    scheduleEntries: ScheduleEntry[];
    recentAnnouncements: Announcement[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch teacher data");
      setData(result);
    } catch (err) {
      console.error("Failed to fetch teacher data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  if (loading) {
    return (
      <NextLayoutWrapper>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <Skeleton className="h-14 w-64 bg-white/20" />
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          </main>
        </div>
      </NextLayoutWrapper>
    );
  }

  return (
    <NextLayoutWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {(user?.displayName || "T")[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome, {user?.displayName || "Teacher"}!</h1>
                  <p className="text-white/80">Teacher Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-purple-100 rounded-xl">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Batches</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data?.upcomingBatches?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-100 rounded-xl">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data?.totalStudents || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-100 rounded-xl">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">This Week</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data?.scheduleEntries?.length || 0} Classes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upcoming Batches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Your Upcoming Batches
                </CardTitle>
                <CardDescription>Batches you are assigned to teach</CardDescription>
              </CardHeader>
              <CardContent>
                {(!data?.upcomingBatches || data.upcomingBatches.length === 0) ? (
                  <p className="text-gray-500 text-center py-8">No upcoming batches</p>
                ) : (
                  <div className="space-y-4">
                    {data.upcomingBatches.map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{batch.name}</p>
                          <p className="text-sm text-gray-500">{batch.course?.name}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={batch.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-gray-100"}>
                            {batch.enrolled}/{batch.capacity} students
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  This Week&apos;s Schedule
                </CardTitle>
                <CardDescription>Your upcoming classes</CardDescription>
              </CardHeader>
              <CardContent>
                {(!data?.scheduleEntries || data.scheduleEntries.length === 0) ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No classes scheduled this week</p>
                    <p className="text-sm text-gray-400">Classes will appear when batch starts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.scheduleEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center w-12">
                          <p className="text-xs text-gray-500 uppercase">{getDayName(entry.date)}</p>
                          <p className="text-lg font-bold text-gray-900">{formatDate(entry.date)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Day {entry.dayNumber}</p>
                          <p className="text-sm text-gray-500">{entry.batch?.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href={`/${locale}/app/teacher/schedule`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Schedule
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link href={`/${locale}/app/teacher/students`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      View Student List
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link href={`/${locale}/app/teacher/announcements`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Post Announcement
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.recentAnnouncements || data.recentAnnouncements.length === 0) ? (
                  <p className="text-gray-500 text-center py-8">No announcements yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.recentAnnouncements.map((ann) => (
                      <div key={ann.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{ann.title}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {ann.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </NextLayoutWrapper>
  );
}
