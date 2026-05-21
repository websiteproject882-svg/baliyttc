"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FileText, MessageSquare, Image, CheckCircle } from "lucide-react";

export default function StaffDashboardPage() {
  const { user, role } = useAuth();

  const roleWelcome = {
    TEACHER: "Teacher Dashboard",
    SEO_EDITOR: "Content Editor Dashboard",
    FINANCE_MANAGER: "Finance Dashboard",
    COURSE_MANAGER: "Course Manager Dashboard",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            {roleWelcome[role as keyof typeof roleWelcome] || "Staff Dashboard"}
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.displayName || "Staff Member"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Schedule items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Content</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Pending reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {role === "TEACHER" && (
              <>
                <ActionItem href="/staff/schedule" icon={Calendar} label="View Schedule" />
                <ActionItem href="/staff/my-batch" icon={Users} label="My Batch Students" />
                <ActionItem href="/staff/announcements" icon={MessageSquare} label="Post Announcement" />
              </>
            )}
            {role === "SEO_EDITOR" && (
              <>
                <ActionItem href="/staff/blog" icon={FileText} label="Manage Blog Posts" />
                <ActionItem href="/staff/gallery" icon={Image} label="Manage Gallery" />
              </>
            )}
            {role === "FINANCE_MANAGER" && (
              <>
                <ActionItem href="/admin/finance" icon={FileText} label="View Payments" />
                <ActionItem href="/admin/enrollments" icon={Users} label="Review Enrollments" />
              </>
            )}
            {role === "COURSE_MANAGER" && (
              <>
                <ActionItem href="/admin/courses" icon={FileText} label="Manage Courses" />
                <ActionItem href="/admin/batches" icon={Calendar} label="Manage Batches" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Your activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <Icon className="h-5 w-5 text-emerald-600" />
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  );
}
