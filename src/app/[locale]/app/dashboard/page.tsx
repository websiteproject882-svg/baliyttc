"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Clock, Calendar, BookOpen, Video, FileText,
  MessageCircle, Download, Award, ChevronRight, Bell, Loader2,
  GraduationCap, BookMarked, Users, CreditCard, WalletCards, Plane,
  StickyNote, ClipboardCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PortalData = {
  student: {
    id: string;
    email: string;
    name: string;
    enrolledCourse: string | null;
    paymentStatus: string;
    accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
    completedHours: number;
    totalHours: number;
    batch?: {
      name: string;
      startDate: string;
      endDate: string;
      course?: { name: string };
    } | null;
    enrollments?: Array<{
      id: string;
      courseName: string;
      batchName?: string | null;
      paymentStatus: string;
      amount: number;
      currency: string;
      createdAt: string;
    }>;
    paymentSummary?: {
      confirmedPayments: number;
      pendingPayments: number;
      failedPayments: number;
      totalPaid: number;
    };
  };
  tasks: Array<{
    id: string;
    taskKey: string;
    taskTitle: string;
    completed: boolean;
  }>;
  progress: Array<{
    id: string;
    moduleId: string;
    moduleTitle: string;
    completed: boolean;
    notes: string;
    hours: number;
  }>;
  certificates: Array<{
    id: string;
    certificateId: string;
    course: string;
    status: string;
    issuedAt: string;
  }>;
  schedule: Array<{
    id: string;
    date: string;
    dayNumber: number;
    activities: Array<{ time: string; title: string; type: string }>;
    notes?: string | null;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string | null;
    url: string;
    type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
    audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE";
    taskKey?: string | null;
  }>;
};

const accessLevelConfig: Record<string, {
  color: string;
  icon: React.ElementType;
  title: string;
  description: string;
}> = {
  NONE: {
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: Clock,
    title: "No Access",
    description: "Complete your enrollment to access the student portal.",
  },
  PRE_ARRIVAL: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Calendar,
    title: "Pre-Arrival Access",
    description: "Complete your preparation tasks to arrive ready for training.",
  },
  FULL: {
    color: "bg-green-50 text-green-700 border-green-200",
    icon: GraduationCap,
    title: "Full Student Access",
    description: "Your training is active. Check your schedule and resources.",
  },
  ALUMNI: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Award,
    title: "Alumni Access",
    description: "Congratulations! Your certificates and school updates remain available.",
  },
};

const resourceTypeIcons = {
  VIDEO: { icon: Video, color: "text-red-600 bg-red-50" },
  DOCUMENT: { icon: FileText, color: "text-purple-600 bg-purple-50" },
  COMMUNITY: { icon: Users, color: "text-green-600 bg-green-50" },
  LINK: { icon: BookMarked, color: "text-blue-600 bg-blue-50" },
};

export default function StudentDashboardPage() {
  const params = useParams<{ locale: string }>();
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPortal = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/app/portal");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load portal");
      setPortal(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  const progress = useMemo(() => {
    if (!portal) return 0;
    return Math.round((portal.student.completedHours / portal.student.totalHours) * 100);
  }, [portal]);

  const toggleTask = async (taskKey: string, completed: boolean) => {
    setTogglingTask(taskKey);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/app/tasks/${taskKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Could not update task");
      }
      await loadPortal();
      setActionMessage(completed ? "Task moved back to pending." : "Task marked complete.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setTogglingTask(null);
    }
  };

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "TBD";

  if (loading || !portal) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const accessConfig = accessLevelConfig[portal.student.accessLevel] || accessLevelConfig.NONE;
  const AccessIcon = accessConfig.icon;
  const nextSchedule = portal.schedule.slice(0, 3);
  const incompleteTasks = portal.tasks.filter(t => !t.completed);
  const completedTasks = portal.tasks.filter(t => t.completed);
  const enrollments = portal.student.enrollments || [];
  const paymentSummary = portal.student.paymentSummary;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {portal.student.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {portal.student.batch?.course?.name || portal.student.enrolledCourse || "Yoga Teacher Training"}
          </p>
        </div>
        <Badge className={`px-3 py-1.5 text-sm border ${accessConfig.color}`}>
          <AccessIcon className="h-4 w-4 mr-1.5" />
          {accessConfig.title}
        </Badge>
      </div>

      {/* Access Level Info Banner */}
      <div className={`rounded-xl border p-4 ${accessConfig.color}`}>
        <p className="text-sm font-medium">{accessConfig.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { href: `/${params.locale}/app/pre-arrival`, label: "Pre-Arrival", icon: Plane },
          { href: `/${params.locale}/app/lessons`, label: "Lessons", icon: Video },
          { href: `/${params.locale}/app/schedule`, label: "Schedule", icon: Calendar },
          { href: `/${params.locale}/app/notes`, label: "Notes", icon: StickyNote },
          { href: `/${params.locale}/app/reviews`, label: "Reviews", icon: MessageCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            >
              <span className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{portal.student.completedHours}</p>
                <p className="text-xs text-gray-500">Hours Completed</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                <p className="text-xs text-gray-500">Tasks Done</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{incompleteTasks.length} remaining</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2.5">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{nextSchedule.length}</p>
                <p className="text-xs text-gray-500">Upcoming Days</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {portal.student.batch?.startDate
                ? `Starts ${formatDate(portal.student.batch.startDate)}`
                : "TBD"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-2.5">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{portal.certificates.length}</p>
                <p className="text-xs text-gray-500">Certificates</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {portal.certificates.length > 0 ? "Available to download" : "Complete training"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment + Enrollment Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              My Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollments.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Your confirmed enrollment will appear here after payment verification.
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{enrollment.courseName || "Yoga Teacher Training"}</p>
                    <p className="text-sm text-gray-500">
                      {enrollment.batchName || "Batch pending"} - {formatDate(enrollment.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-50">
                      {enrollment.paymentStatus.replaceAll("_", " ")}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900">
                      {enrollment.currency} {Number(enrollment.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Payment Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Current status</p>
              <p className="mt-1 text-lg font-bold text-orange-950">{portal.student.paymentStatus.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-orange-700">
                Deposit unlocks preparation. Full payment unlocks complete course content.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-lg font-bold text-gray-900">{paymentSummary?.confirmedPayments ?? 0}</p>
                <p className="text-[10px] text-gray-500">Confirmed</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-lg font-bold text-gray-900">{paymentSummary?.pendingPayments ?? 0}</p>
                <p className="text-[10px] text-gray-500">Pending</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-lg font-bold text-gray-900">${Number(paymentSummary?.totalPaid || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Paid</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">
              <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              Payment records update here after school verification. Online payment keys can be connected before client handoff.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Arrival Tasks */}
        {portal.student.accessLevel !== "ALUMNI" && (
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-500" />
                  Pre-Arrival Tasks
                </CardTitle>
                {incompleteTasks.length > 0 && (
                  <Badge variant="outline">{incompleteTasks.length} remaining</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionMessage && (
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                  {actionMessage}
                </div>
              )}
              {portal.tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm">No preparation tasks assigned yet.</p>
                </div>
              ) : (
                <>
                  {incompleteTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.taskTitle}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={togglingTask === task.taskKey}
                        onClick={() => toggleTask(task.taskKey, task.completed)}
                      >
                        {togglingTask === task.taskKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Mark Done"
                        )}
                      </Button>
                    </div>
                  ))}

                  {completedTasks.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Completed</p>
                      {completedTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-green-50/50"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-gray-600 line-through truncate">{task.taskTitle}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Link href={`/${params.locale}/app/pre-arrival`} className="block mt-3">
                <Button variant="ghost" size="sm" className="w-full text-orange-600">
                  Open Checklist <ClipboardCheck className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Schedule */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                {portal.student.accessLevel === "FULL" ? "Today's Schedule" : "Upcoming Days"}
              </CardTitle>
              <Link href={`/${params.locale}/app/schedule`}>
                <Button variant="ghost" size="sm" className="text-orange-600">
                  Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextSchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No schedule entries yet.</p>
                <p className="text-xs text-gray-400">Check back closer to your batch start date.</p>
              </div>
            ) : (
              nextSchedule.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-gray-100 p-4 hover:border-orange-200 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Day {entry.dayNumber}</Badge>
                      <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {entry.activities.slice(0, 3).map((activity, index) => (
                      <div key={`${entry.id}-${index}`} className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600 w-16">{activity.time}</span>
                        <span className="text-gray-900">{activity.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="border-0 bg-white shadow-sm" id="resources">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-orange-500" />
                Your Resources
              </CardTitle>
              <Badge variant="outline">{portal.resources.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {portal.resources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No resources published yet.</p>
              </div>
            ) : (
              portal.resources.slice(0, 4).map((item) => {
                const TypeConfig = resourceTypeIcons[item.type] || resourceTypeIcons.LINK;
                const TypeIcon = TypeConfig.icon;
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className={`rounded-lg p-2 ${TypeConfig.color}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </a>
                );
              })
            )}

            {portal.certificates.length > 0 && (
              <a
                href={`/api/certificates/${portal.certificates[0].id}/download`}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors"
              >
                <div className="rounded-lg bg-orange-100 p-2">
                  <Award className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">Certificate Ready</p>
                  <p className="text-xs text-orange-600">Download your PDF certificate</p>
                </div>
                <Download className="h-4 w-4 text-orange-600" />
              </a>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Announcements
              </CardTitle>
              {portal.announcements.length > 0 && (
                <Badge variant="outline">{portal.announcements.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {portal.announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No announcements yet.</p>
              </div>
            ) : (
              portal.announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                        {announcement.type === "URGENT" && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
