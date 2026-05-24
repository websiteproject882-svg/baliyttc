"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Shield, Search, Edit, Loader2,
  UserPlus, Mail, ShieldCheck, AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  name?: string;
  displayName?: string;
  role: "SUPER_ADMIN" | "STUDENT_MANAGER" | "SEO_EDITOR" | "FINANCE_MANAGER" | "COURSE_MANAGER" | "TEACHER";
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  permissions: string[];
  lastLogin: string | null;
  invitedAt: string;
}

const roleConfig = {
  SUPER_ADMIN: { color: "bg-red-100 text-red-700 border-red-200", label: "Super Admin", icon: Shield },
  STUDENT_MANAGER: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Student Manager", icon: UserPlus },
  SEO_EDITOR: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "SEO Editor", icon: Edit },
  FINANCE_MANAGER: { color: "bg-green-100 text-green-700 border-green-200", label: "Finance Manager", icon: Mail },
  COURSE_MANAGER: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Course Manager", icon: ShieldCheck },
  TEACHER: { color: "bg-teal-100 text-teal-700 border-teal-200", label: "Teacher", icon: ShieldCheck },
};

const statusConfig = {
  ACTIVE: { color: "bg-green-500", label: "Active" },
  INACTIVE: { color: "bg-gray-400", label: "Inactive" },
  PENDING: { color: "bg-amber-500", label: "Pending" },
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "TEACHER" as StaffMember["role"],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/staff");
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, []);

  const handleInvite = async () => {
    if (!form.email || !form.name) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, name: form.name, role: form.role }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: `${form.name} has been invited successfully`,
        });
        setDialogOpen(false);
        setForm({ email: "", name: "", role: "TEACHER" });
        await fetchStaff();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to invite member",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to invite member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffMember: StaffMember) => {
    const isCurrentlyActive = staffMember.status === "ACTIVE";
    const newEnabled = !isCurrentlyActive;

    if (staffMember.role === "SUPER_ADMIN" && isCurrentlyActive) {
      const superAdminCount = staff.filter(s => s.role === "SUPER_ADMIN" && s.status === "ACTIVE").length;
      if (superAdminCount <= 1) {
        toast({
          title: "Cannot Disable",
          description: "Cannot disable the last admin account",
          variant: "destructive",
        });
        return;
      }
    }

    setToggling(staffMember.id);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: staffMember.id, enabled: newEnabled }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: newEnabled ? "Access Enabled" : "Access Disabled",
          description: data.message || `${staffMember.displayName || staffMember.name}'s access has been ${newEnabled ? "enabled" : "disabled"}`,
        });
        await fetchStaff();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update access",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  const filteredStaff = staff.filter(s =>
    !search ||
    (s.displayName || s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === "ACTIVE").length,
    inactive: staff.filter(s => s.status === "INACTIVE").length,
    pending: staff.filter(s => s.status === "PENDING").length,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDisplayName = (member: StaffMember) => member.displayName || member.name || "Unknown";

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff & Roles</h1>
            <p className="text-sm text-gray-500 mt-1">Manage team members and control their access</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Members</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-green-600">Active</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-amber-600">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {filteredStaff.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No staff members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((member) => {
                      const role = roleConfig[member.role];
                      const status = statusConfig[member.status];
                      const isActive = member.status === "ACTIVE";
                      const RoleIcon = role.icon;

                      return (
                        <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${!isActive ? "bg-gray-50/50" : ""}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                isActive ? "bg-gradient-to-br from-orange-400 to-orange-600" : "bg-gray-400"
                              }`}>
                                {getDisplayName(member).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{getDisplayName(member)}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${role.color} border font-medium`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {role.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${status.color}`} />
                              <span className="text-sm text-gray-600">{status.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(member.lastLogin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-3">
                              {member.role === "SUPER_ADMIN" && isActive && (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Protected
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{isActive ? "Enabled" : "Disabled"}</span>
                                <button
                                  onClick={() => handleToggleStatus(member)}
                                  disabled={toggling === member.id || (member.role === "SUPER_ADMIN" && isActive)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                                    isActive ? "bg-green-500" : "bg-gray-300"
                                  } ${toggling === member.id ? "opacity-50" : ""}`}
                                >
                                  {toggling === member.id ? (
                                    <Loader2 className="h-4 w-4 mx-auto animate-spin text-white" />
                                  ) : (
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        isActive ? "translate-x-6" : "translate-x-1"
                                      }`}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              Role Permissions
            </h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <p className="font-medium text-red-700">Super Admin</p>
                </div>
                <p className="text-xs text-red-600/80">Full system access. Manage all staff, settings, and data.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <p className="font-medium text-blue-700">Student Manager</p>
                </div>
                <p className="text-xs text-blue-600/80">Manage enrollments, students, and communications.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="h-4 w-4 text-purple-600" />
                  <p className="font-medium text-purple-700">SEO Editor</p>
                </div>
                <p className="text-xs text-purple-600/80">Manage blog, gallery, testimonials, and FAQ.</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <p className="font-medium text-green-700">Finance Manager</p>
                </div>
                <p className="text-xs text-green-600/80">Handle payments, refunds, coupons, and revenue.</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-orange-600" />
                  <p className="font-medium text-orange-700">Course Manager</p>
                </div>
                <p className="text-xs text-orange-600/80">Manage courses, batches, schedules, and resources.</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  <p className="font-medium text-teal-700">Teacher</p>
                </div>
                <p className="text-xs text-teal-600/80">View assigned batch students and post announcements.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-600" />
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffMember["role"] })}
              >
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT_MANAGER">Student Manager</option>
                <option value="SEO_EDITOR">SEO Editor</option>
                <option value="FINANCE_MANAGER">Finance Manager</option>
                <option value="COURSE_MANAGER">Course Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => void handleInvite()}
              disabled={submitting || !form.email || !form.name}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
