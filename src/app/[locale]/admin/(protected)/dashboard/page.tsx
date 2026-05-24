"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, DollarSign, GraduationCap, Calendar,
  Search, Eye, Mail, CreditCard, BookOpen, Tag, Bell,
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, XCircle,
  Loader2, ShieldCheck, ClipboardList, Plus, Pencil, Trash2, MessageCircle
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  DEPOSIT_PAID: "bg-blue-100 text-blue-800 border-blue-200",
  FULL_PAID: "bg-green-100 text-green-800 border-green-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

interface AnalyticsStats {
  totalEnrollments: number;
  totalStudents: number;
  totalRevenue: number;
  upcomingBatches: number;
  monthlyRevenue: number;
}

interface Enrollment {
  id: string;
  name: string;
  email: string;
  courseSlug: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  accessLevel?: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  user?: {
    email: string;
    displayName: string;
  };
  student?: {
    id: string;
    completedHours: number;
    totalHours: number;
    certificateIssued: boolean;
  };
}

interface Batch {
  id: string;
  name: string;
  enrolled: number;
  capacity: number;
  status: string;
  startDate: string;
  endDate: string;
  course?: {
    name: string;
  };
  priceRegular?: number;
  priceEarlyBird?: number | null;
  waitlistEnabled?: boolean;
  accommodation?: Array<{
    id: string;
    type: "SHARED" | "PRIVATE";
    price: number;
    mandatory: boolean;
  }>;
}

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  permissions: string[];
  invitedAt: string;
  lastLogin?: string | null;
}

interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  course: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "ENROLLED" | "NOT_INTERESTED" | "SPAM";
  notes: string | null;
  assignedTo: string | null;
  followUpAt: string | null;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  oldValue?: unknown;
  newValue?: unknown;
  user: {
    email: string;
    displayName: string | null;
  };
}

interface CourseOption {
  id: string;
  name: string;
  slug: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discount: number;
  minAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "BATCH" | "URGENT";
  batchId: string | null;
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION";
  audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE" | "INDIVIDUAL";
  batchId: string | null;
  studentId: string | null;
  actionUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface PreArrivalResourceItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
  audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE";
  taskKey: string | null;
  order: number;
  isActive: boolean;
}

interface TestimonialItem {
  id: string;
  rating: number;
  quote: string;
  location: string | null;
  courseName: string | null;
  graduationYear: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface CommunicationRecipientItem {
  key: string;
  campaign: "ABANDONED_ENROLLMENT" | "PAYMENT_REMINDER" | "PREPARATION_REMINDER" | "VISA_GUIDANCE" | "REVIEW_REQUEST";
  targetType: "ENROLLMENT" | "STUDENT";
  targetId: string;
  studentId: string;
  enrollmentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  courseName: string;
  batchName: string | null;
  batchStartDate: string | null;
  daysUntilStart: number | null;
  daysSinceEnd: number | null;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  paymentStatus: string;
  channels: Array<"EMAIL" | "WHATSAPP">;
}

interface CommunicationLogItem {
  id: string;
  campaign: "ABANDONED_ENROLLMENT" | "PAYMENT_REMINDER" | "PREPARATION_REMINDER" | "VISA_GUIDANCE" | "REVIEW_REQUEST";
  channel: "EMAIL" | "WHATSAPP";
  targetType: "ENROLLMENT" | "STUDENT";
  targetId: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  status: "SENT" | "FAILED" | "SKIPPED";
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
}

export default function AdminDashboard() {
  const params = useParams<{ locale?: string }>();
  const searchParams = useSearchParams();
  const locale = params?.locale || "en";
  const tab = searchParams.get("tab") || "overview";
  const [search, setSearch] = useState("");

  // Data states
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [resources, setResources] = useState<PreArrivalResourceItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [communicationQueues, setCommunicationQueues] = useState<Record<string, CommunicationRecipientItem[]>>({});
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLogItem[]>([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({ email: "", name: "", role: "STUDENT_MANAGER" });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffEditForm, setStaffEditForm] = useState({ name: "", role: "STUDENT_MANAGER", status: "PENDING" });
  const [auditFilters, setAuditFilters] = useState({ entity: "", action: "", actor: "" });
  const [couponForm, setCouponForm] = useState({
    id: "",
    code: "",
    discountType: "PERCENTAGE",
    discount: "10",
    minAmount: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
  });
  const [batchForm, setBatchForm] = useState({
    id: "",
    courseId: "",
    name: "",
    startDate: "",
    endDate: "",
    capacity: "20",
    priceRegular: "0",
    priceEarlyBird: "",
    earlyBirdDeadline: "",
    status: "DRAFT",
    waitlistEnabled: false,
    accommodation: [
      { type: "SHARED", price: "0", mandatory: false },
      { type: "PRIVATE", price: "0", mandatory: false },
    ],
  });
  const [moduleSubmitting, setModuleSubmitting] = useState<"coupon" | "batch" | null>(null);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    id: "",
    title: "",
    content: "",
    type: "GENERAL",
    batchId: "",
  });
  const [notificationForm, setNotificationForm] = useState({
    id: "",
    title: "",
    message: "",
    type: "INFO",
    audience: "ALL_ACTIVE",
    batchId: "",
    studentId: "",
    actionUrl: "",
  });
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [campaignRunning, setCampaignRunning] = useState<string | null>(null);
  const [leadSavingId, setLeadSavingId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadEditForm, setLeadEditForm] = useState({ status: "NEW", notes: "", followUpAt: "" });
  const [resourceForm, setResourceForm] = useState({
    id: "",
    title: "",
    description: "",
    url: "",
    type: "LINK",
    audience: "PRE_ARRIVAL",
    taskKey: "",
    order: "0",
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const auditQuery = new URLSearchParams({ limit: "25" });
      if (auditFilters.entity) auditQuery.set("entity", auditFilters.entity);
      if (auditFilters.action) auditQuery.set("action", auditFilters.action);
      if (auditFilters.actor) auditQuery.set("actor", auditFilters.actor);

      const [analyticsRes, enrollmentsRes, leadsRes, batchesRes, staffRes, auditRes, twoFactorRes, coursesRes, couponsRes, announcementsRes, notificationsRes, resourcesRes, testimonialsRes, communicationsRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/enrollments'),
        fetch('/api/admin/leads?limit=50'),
        fetch('/api/admin/batches'),
        fetch('/api/admin/staff'),
        fetch(`/api/admin/audit?${auditQuery.toString()}`),
        fetch('/api/admin/2fa'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/announcements'),
        fetch('/api/admin/notifications'),
        fetch('/api/admin/prearrival-resources'),
        fetch('/api/admin/testimonials'),
        fetch('/api/admin/communications'),
      ]);

      const [analytics, enrollData, leadsData, batchesData, staffData, auditData, twoFactorData, coursesData, couponsData, announcementsData, notificationsData, resourcesData, testimonialsData, communicationsData] = await Promise.all([
        analyticsRes.json(),
        enrollmentsRes.json(),
        leadsRes.json(),
        batchesRes.json(),
        staffRes.json(),
        auditRes.json(),
        twoFactorRes.json(),
        coursesRes.json(),
        couponsRes.json(),
        announcementsRes.json(),
        notificationsRes.json(),
        resourcesRes.json(),
        testimonialsRes.json(),
        communicationsRes.json(),
      ]);

      setStats(analytics.stats);
      setEnrollments(enrollData.enrollments || []);
      setLeads(leadsRes.ok ? (leadsData.leads || []) : []);
      setBatches(batchesData.batches || []);
      setCourseOptions((coursesRes.ok ? coursesData.courses : []).map((course: CourseOption) => ({ id: course.id, name: course.name, slug: course.slug })));
      setCoupons(couponsRes.ok ? (couponsData.coupons || []) : []);
      setAnnouncements(announcementsRes.ok ? (announcementsData.announcements || []) : []);
      setNotifications(notificationsRes.ok ? (notificationsData.notifications || []) : []);
      setResources(resourcesRes.ok ? (resourcesData.resources || []) : []);
      setTestimonials(testimonialsRes.ok ? (testimonialsData.testimonials || []) : []);
      setCommunicationQueues(communicationsRes.ok ? (communicationsData.queues || {}) : {});
      setCommunicationLogs(communicationsRes.ok ? (communicationsData.logs || []) : []);
      setStaff(staffRes.ok ? (staffData.staff || []) : []);
      setAuditLogs(auditRes.ok ? (auditData.logs || []) : []);
      setTwoFactorStatus(twoFactorRes.ok ? twoFactorData : null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [auditFilters.action, auditFilters.actor, auditFilters.entity]);

  // Fetch data on mount and when audit filters change.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEnrollments = enrollments.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  const studentSummaries = useMemo(() => {
    const seen = new Set<string>();

    return enrollments.flatMap((enrollment) => {
      const studentId = enrollment.student?.id;
      if (!studentId || seen.has(studentId)) {
        return [];
      }

      seen.add(studentId);
      return [{
        id: studentId,
        name: enrollment.user?.displayName || enrollment.name || "Student",
        email: enrollment.user?.email || enrollment.email,
        completedHours: enrollment.student?.completedHours || 0,
        totalHours: enrollment.student?.totalHours || 0,
        accessLevel: enrollment.accessLevel || "NONE",
        courseSlug: enrollment.courseSlug,
      }];
    });
  }, [enrollments]);

  const filteredStaff = staff.filter((member) =>
    [member.name || "", member.email, member.role, member.status].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const filteredLeads = leads.filter((lead) =>
    [lead.name, lead.email, lead.source, lead.course || "", lead.status, lead.notes || ""].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const filteredCoupons = coupons.filter((coupon) =>
    [coupon.code, coupon.discountType].some((value) => value.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredAnnouncements = announcements.filter((announcement) =>
    [announcement.title, announcement.content, announcement.type].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const filteredNotifications = notifications.filter((notification) =>
    [notification.title, notification.message, notification.type, notification.audience, notification.actionUrl || ""].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const filteredResources = resources.filter((resource) =>
    [resource.title, resource.description || "", resource.type, resource.audience, resource.taskKey || ""].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const filteredTestimonials = testimonials.filter((testimonial) =>
    [testimonial.student.name, testimonial.student.email, testimonial.quote, testimonial.status, testimonial.courseName || ""].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const campaignCards = [
    {
      key: "ABANDONED_ENROLLMENT",
      title: "Abandoned enrollments",
      description: "Started enrollments with no payment and no unlocked access yet.",
    },
    {
      key: "PAYMENT_REMINDER",
      title: "Payment reminders",
      description: "Students with pending balance and upcoming batch dates.",
    },
    {
      key: "PREPARATION_REMINDER",
      title: "Preparation reminders",
      description: "Active students who should finish pre-arrival prep soon.",
    },
    {
      key: "VISA_GUIDANCE",
      title: "Visa guidance",
      description: "Students approaching arrival who should review visa and entry requirements.",
    },
    {
      key: "REVIEW_REQUEST",
      title: "Review requests",
      description: "Recent alumni without an approved testimonial yet.",
    },
  ] as const;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'pending',
      DEPOSIT_PAID: 'deposit_paid',
      FULL_PAID: 'confirmed',
      FAILED: 'failed',
      OPEN: 'open',
      DRAFT: 'draft',
      FULL: 'full',
      CLOSED: 'closed',
    };
    return labels[status] || status.toLowerCase();
  };

  const runCommunicationCampaign = async (campaign: string) => {
    setCampaignRunning(campaign);
    setError(null);
    try {
      const response = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, limit: 25 }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to run communication campaign");
      }
      await fetchData();
    } catch (communicationError) {
      setError(communicationError instanceof Error ? communicationError.message : "Failed to run communication campaign");
    } finally {
      setCampaignRunning(null);
    }
  };

  const saveLead = async () => {
    if (!editingLeadId) {
      return;
    }

    setLeadSavingId(editingLeadId);
    setError(null);
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLeadId,
          status: leadEditForm.status,
          notes: leadEditForm.notes,
          followUpAt: leadEditForm.followUpAt || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update lead");
      }
      setEditingLeadId(null);
      setLeadEditForm({ status: "NEW", notes: "", followUpAt: "" });
      await fetchData();
    } catch (leadError) {
      setError(leadError instanceof Error ? leadError.message : "Failed to update lead");
    } finally {
      setLeadSavingId(null);
    }
  };

  const submitStaffInvite = async () => {
    setStaffSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to invite staff");
      }
      setStaffForm({ email: "", name: "", role: "STUDENT_MANAGER" });
      await fetchData();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to invite staff");
    } finally {
      setStaffSubmitting(false);
    }
  };

  const saveStaffEdit = async () => {
    if (!editingStaffId) {
      return;
    }

    setStaffSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStaffId,
          name: staffEditForm.name,
          role: staffEditForm.role,
          status: staffEditForm.status,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update staff");
      }
      setEditingStaffId(null);
      setStaffEditForm({ name: "", role: "STUDENT_MANAGER", status: "PENDING" });
      await fetchData();
    } catch (staffError) {
      setError(staffError instanceof Error ? staffError.message : "Failed to update staff");
    } finally {
      setStaffSubmitting(false);
    }
  };

  const saveAnnouncement = async () => {
    setAnnouncementSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: announcementForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(announcementForm.id ? { id: announcementForm.id } : {}),
          title: announcementForm.title,
          content: announcementForm.content,
          type: announcementForm.type,
          batchId: announcementForm.batchId || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save announcement");
      }
      setAnnouncementForm({
        id: "",
        title: "",
        content: "",
        type: "GENERAL",
        batchId: "",
      });
      await fetchData();
    } catch (announcementError) {
      setError(announcementError instanceof Error ? announcementError.message : "Failed to save announcement");
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete announcement");
      }
      if (announcementForm.id === id) {
        setAnnouncementForm({
          id: "",
          title: "",
          content: "",
          type: "GENERAL",
          batchId: "",
        });
      }
      await fetchData();
    } catch (announcementError) {
      setError(announcementError instanceof Error ? announcementError.message : "Failed to delete announcement");
    }
  };

  const saveNotification = async () => {
    setNotificationSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: notificationForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(notificationForm.id ? { id: notificationForm.id } : {}),
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          audience: notificationForm.audience,
          batchId: notificationForm.batchId || null,
          studentId: notificationForm.audience === "INDIVIDUAL" ? notificationForm.studentId || null : null,
          actionUrl: notificationForm.actionUrl || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save notification");
      }
      setNotificationForm({
        id: "",
        title: "",
        message: "",
        type: "INFO",
        audience: "ALL_ACTIVE",
        batchId: "",
        studentId: "",
        actionUrl: "",
      });
      await fetchData();
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Failed to save notification");
    } finally {
      setNotificationSubmitting(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete notification");
      }
      if (notificationForm.id === id) {
        setNotificationForm({
          id: "",
          title: "",
          message: "",
          type: "INFO",
          audience: "ALL_ACTIVE",
          batchId: "",
          studentId: "",
          actionUrl: "",
        });
      }
      await fetchData();
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Failed to delete notification");
    }
  };

  const saveResource = async () => {
    setResourceSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/prearrival-resources", {
        method: resourceForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(resourceForm.id ? { id: resourceForm.id } : {}),
          title: resourceForm.title,
          description: resourceForm.description || null,
          url: resourceForm.url,
          type: resourceForm.type,
          audience: resourceForm.audience,
          taskKey: resourceForm.taskKey || null,
          order: Number(resourceForm.order),
          isActive: resourceForm.isActive,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save resource");
      }
      setResourceForm({
        id: "",
        title: "",
        description: "",
        url: "",
        type: "LINK",
        audience: "PRE_ARRIVAL",
        taskKey: "",
        order: "0",
        isActive: true,
      });
      await fetchData();
    } catch (resourceError) {
      setError(resourceError instanceof Error ? resourceError.message : "Failed to save resource");
    } finally {
      setResourceSubmitting(false);
    }
  };

  const deleteResource = async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/prearrival-resources?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete resource");
      }
      if (resourceForm.id === id) {
        setResourceForm({
          id: "",
          title: "",
          description: "",
          url: "",
          type: "LINK",
          audience: "PRE_ARRIVAL",
          taskKey: "",
          order: "0",
          isActive: true,
        });
      }
      await fetchData();
    } catch (resourceError) {
      setError(resourceError instanceof Error ? resourceError.message : "Failed to delete resource");
    }
  };

  const moderateTestimonial = async (id: string, status: "APPROVED" | "REJECTED" | "PENDING") => {
    setError(null);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update testimonial");
      }
      await fetchData();
    } catch (testimonialError) {
      setError(testimonialError instanceof Error ? testimonialError.message : "Failed to update testimonial");
    }
  };

  const submitCoupon = async () => {
    setModuleSubmitting("coupon");
    setError(null);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...couponForm,
          discount: Number(couponForm.discount),
          minAmount: couponForm.minAmount ? Number(couponForm.minAmount) : null,
          maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : null,
          usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
          expiresAt: couponForm.expiresAt || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create coupon");
      }
      setCouponForm({
        id: "",
        code: "",
        discountType: "PERCENTAGE",
        discount: "10",
        minAmount: "",
        maxDiscount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
      });
      await fetchData();
    } catch (couponError) {
      setError(couponError instanceof Error ? couponError.message : "Failed to create coupon");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const submitBatch = async () => {
    setModuleSubmitting("batch");
    setError(null);
    try {
      const response = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...batchForm,
          capacity: Number(batchForm.capacity),
          priceRegular: Number(batchForm.priceRegular),
          priceEarlyBird: batchForm.priceEarlyBird ? Number(batchForm.priceEarlyBird) : null,
          earlyBirdDeadline: batchForm.earlyBirdDeadline || null,
          accommodation: batchForm.accommodation.map((item) => ({
            type: item.type,
            price: Number(item.price),
            mandatory: item.mandatory,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create batch");
      }
      setBatchForm({
        id: "",
        courseId: "",
        name: "",
        startDate: "",
        endDate: "",
        capacity: "20",
        priceRegular: "0",
        priceEarlyBird: "",
        earlyBirdDeadline: "",
        status: "DRAFT",
        waitlistEnabled: false,
        accommodation: [
          { type: "SHARED", price: "0", mandatory: false },
          { type: "PRIVATE", price: "0", mandatory: false },
        ],
      });
      await fetchData();
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : "Failed to create batch");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const saveCoupon = async () => {
    setModuleSubmitting("coupon");
    setError(null);
    try {
      const payload = {
        ...couponForm,
        discount: Number(couponForm.discount),
        minAmount: couponForm.minAmount ? Number(couponForm.minAmount) : null,
        maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        expiresAt: couponForm.expiresAt || null,
      };
      const response = await fetch("/api/admin/coupons", {
        method: couponForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponForm.id ? payload : { ...payload, id: undefined }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save coupon");
      }
      setCouponForm({
        id: "",
        code: "",
        discountType: "PERCENTAGE",
        discount: "10",
        minAmount: "",
        maxDiscount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
      });
      await fetchData();
    } catch (couponError) {
      setError(couponError instanceof Error ? couponError.message : "Failed to save coupon");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    setModuleSubmitting("coupon");
    setError(null);
    try {
      const response = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete coupon");
      }
      await fetchData();
    } catch (couponError) {
      setError(couponError instanceof Error ? couponError.message : "Failed to delete coupon");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const saveBatch = async () => {
    setModuleSubmitting("batch");
    setError(null);
    try {
      const payload = {
        ...batchForm,
        capacity: Number(batchForm.capacity),
        priceRegular: Number(batchForm.priceRegular),
        priceEarlyBird: batchForm.priceEarlyBird ? Number(batchForm.priceEarlyBird) : null,
        earlyBirdDeadline: batchForm.earlyBirdDeadline || null,
        accommodation: batchForm.accommodation.map((item) => ({
          type: item.type,
          price: Number(item.price),
          mandatory: item.mandatory,
        })),
      };
      const response = await fetch("/api/admin/batches", {
        method: batchForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm.id ? payload : { ...payload, id: undefined }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save batch");
      }
      setBatchForm({
        id: "",
        courseId: "",
        name: "",
        startDate: "",
        endDate: "",
        capacity: "20",
        priceRegular: "0",
        priceEarlyBird: "",
        earlyBirdDeadline: "",
        status: "DRAFT",
        waitlistEnabled: false,
        accommodation: [
          { type: "SHARED", price: "0", mandatory: false },
          { type: "PRIVATE", price: "0", mandatory: false },
        ],
      });
      await fetchData();
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : "Failed to save batch");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const deleteBatch = async (id: string) => {
    setModuleSubmitting("batch");
    setError(null);
    try {
      const response = await fetch(`/api/admin/batches?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete batch");
      }
      await fetchData();
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : "Failed to delete batch");
    } finally {
      setModuleSubmitting(null);
    }
  };

  const handleTwoFactorAction = async (action: "generate" | "verify_setup" | "disable") => {
    setTwoFactorLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code: twoFactorCode }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "2FA action failed");
      }

      if (action === "generate") {
        setTwoFactorQr(result.qrCodeDataUrl || null);
        setTwoFactorSecret(result.manualEntryKey || "");
      } else {
        setTwoFactorQr(null);
        setTwoFactorSecret("");
        setTwoFactorCode("");
      }

      await fetchData();
    } catch (twoFactorError) {
      setError(twoFactorError instanceof Error ? twoFactorError.message : "2FA action failed");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Enrollments",
      value: stats?.totalEnrollments || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      label: "Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      label: "Active Students",
      value: stats?.totalStudents || 0,
      change: "+8%",
      trend: "up",
      icon: GraduationCap,
      color: "bg-purple-500"
    },
    {
      label: "Upcoming Batches",
      value: stats?.upcomingBatches || 0,
      change: "-1",
      trend: "down",
      icon: Calendar,
      color: "bg-orange-500"
    },
  ];

  const renderContent = () => {
    switch (tab) {
      case "students":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <div className="grid gap-4">
              {studentSummaries.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 text-center text-gray-500">
                    No students found
                  </CardContent>
                </Card>
              ) : studentSummaries.map((s: {
                id: string;
                name: string;
                email: string;
                completedHours: number;
                totalHours: number;
                accessLevel: string;
                courseSlug: string;
              }) => {
                const percentComplete = s.totalHours > 0 ? Math.round((s.completedHours / s.totalHours) * 100) : 0;
                return (
                <Card key={s.id} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                          {s.name.split(' ').map((n: string) => n[0]).join('') || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-sm text-gray-500">{s.email}</p>
                          <p className="text-xs text-gray-400 uppercase">{s.courseSlug}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {percentComplete}% complete
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{s.completedHours}/{s.totalHours} hours</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${percentComplete}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        );

      case "enrollments":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Student</th>
                        <th className="text-left py-3 px-2">Course</th>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Amount</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-right py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((e) => (
                        <tr key={e.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <p className="font-medium">{e.name}</p>
                            <p className="text-xs text-gray-500">{e.email}</p>
                          </td>
                          <td className="py-3 px-2 uppercase">{e.courseSlug}</td>
                          <td className="py-3 px-2 text-sm text-gray-500">{formatDate(e.createdAt)}</td>
                          <td className="py-3 px-2 font-medium">{formatCurrency(e.amount)}</td>
                          <td className="py-3 px-2">
                            <Badge className={statusColors[e.paymentStatus] || statusColors.pending}>
                              {getStatusLabel(e.paymentStatus)}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button size="sm" variant="ghost"><Eye size={16} /></Button>
                            <Button size="sm" variant="ghost"><Mail size={16} /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "leads":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                <p className="text-sm text-gray-500">Inbound and automation-created follow-up queue.</p>
              </div>
              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                {leads.length} leads loaded
              </div>
            </div>

            <div className="grid gap-4">
              {filteredLeads.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 text-center text-gray-500">No leads found</CardContent>
                </Card>
              ) : filteredLeads.map((lead) => (
                <Card key={lead.id} className="bg-white border-0 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.email}{lead.phone ? ` • ${lead.phone}` : ""}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {[lead.source, lead.course || "General inquiry", lead.followUpAt ? `Follow up ${formatDate(lead.followUpAt)}` : null].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <Badge className={lead.status === "ENROLLED" ? "bg-green-100 text-green-800" : lead.status === "NOT_INTERESTED" || lead.status === "SPAM" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                        {lead.status.toLowerCase()}
                      </Badge>
                    </div>

                    {editingLeadId === lead.id ? (
                      <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <select
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={leadEditForm.status}
                            onChange={(e) => setLeadEditForm((current) => ({ ...current, status: e.target.value }))}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="INTERESTED">INTERESTED</option>
                            <option value="ENROLLED">ENROLLED</option>
                            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                            <option value="SPAM">SPAM</option>
                          </select>
                          <Input
                            type="date"
                            value={leadEditForm.followUpAt}
                            onChange={(e) => setLeadEditForm((current) => ({ ...current, followUpAt: e.target.value }))}
                          />
                        </div>
                        <textarea
                          className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
                          value={leadEditForm.notes}
                          onChange={(e) => setLeadEditForm((current) => ({ ...current, notes: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={leadSavingId === lead.id} onClick={saveLead}>
                            {leadSavingId === lead.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setEditingLeadId(null);
                            setLeadEditForm({ status: "NEW", notes: "", followUpAt: "" });
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {lead.message ? <p className="text-sm text-gray-600">{lead.message}</p> : null}
                        {lead.notes ? <p className="text-sm text-gray-500">{lead.notes}</p> : null}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingLeadId(lead.id);
                              setLeadEditForm({
                                status: lead.status,
                                notes: lead.notes || "",
                                followUpAt: lead.followUpAt ? lead.followUpAt.slice(0, 10) : "",
                              });
                            }}
                          >
                            <Pencil size={14} className="mr-2" />
                            Manage lead
                          </Button>
                          <a href={`mailto:${lead.email}`} className="inline-flex">
                            <Button variant="outline">
                              <Mail size={14} className="mr-2" />
                              Email
                            </Button>
                          </a>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "finance":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-0 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-100 rounded-xl"><DollarSign className="w-8 h-8 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-0 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-100 rounded-xl"><CheckCircle className="w-8 h-8 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-0 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-100 rounded-xl"><CreditCard className="w-8 h-8 text-amber-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Enrollments</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalEnrollments || 0}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "coupons":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
            <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Create Coupon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="rounded-lg border px-3 py-2 text-sm" value={couponForm.discountType} onChange={(e) => setCouponForm((current) => ({ ...current, discountType: e.target.value }))}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed</option>
                    </select>
                    <Input type="number" placeholder="Discount" value={couponForm.discount} onChange={(e) => setCouponForm((current) => ({ ...current, discount: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Min amount" value={couponForm.minAmount} onChange={(e) => setCouponForm((current) => ({ ...current, minAmount: e.target.value }))} />
                    <Input type="number" placeholder="Max discount" value={couponForm.maxDiscount} onChange={(e) => setCouponForm((current) => ({ ...current, maxDiscount: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm((current) => ({ ...current, usageLimit: e.target.value }))} />
                    <Input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm((current) => ({ ...current, expiresAt: e.target.value }))} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={couponForm.isActive} onChange={(e) => setCouponForm((current) => ({ ...current, isActive: e.target.checked }))} />
                    Active
                  </label>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={saveCoupon} disabled={moduleSubmitting === "coupon"}>
                    {moduleSubmitting === "coupon" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                    {couponForm.id ? "Update coupon" : "Save coupon"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Discount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Usage</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Expiry</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{coupon.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {coupon.discountType === "PERCENTAGE" ? `${coupon.discount}%` : `EUR ${coupon.discount}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{coupon.usedCount}/{coupon.usageLimit ?? "∞"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}</td>
                          <td className="px-4 py-3">
                            <Badge className={coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                              {coupon.isActive ? "active" : "inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCouponForm({
                                    id: coupon.id,
                                    code: coupon.code,
                                    discountType: coupon.discountType,
                                    discount: String(coupon.discount),
                                    minAmount: coupon.minAmount ? String(coupon.minAmount) : "",
                                    maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
                                    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
                                    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
                                    isActive: coupon.isActive,
                                  })
                                }
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteCoupon(coupon.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                <p className="text-sm text-gray-500">Invite and review operational roles</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
                {staff.length} staff records
              </div>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{editingStaffId ? "Edit Staff" : "Invite Staff"}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Input
                  placeholder="Name"
                  value={editingStaffId ? staffEditForm.name : staffForm.name}
                  onChange={(e) =>
                    editingStaffId
                      ? setStaffEditForm((current) => ({ ...current, name: e.target.value }))
                      : setStaffForm((current) => ({ ...current, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Email"
                  value={editingStaffId ? (staff.find((member) => member.id === editingStaffId)?.email || "") : staffForm.email}
                  onChange={(e) => setStaffForm((current) => ({ ...current, email: e.target.value }))}
                  disabled={Boolean(editingStaffId)}
                />
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={editingStaffId ? staffEditForm.role : staffForm.role}
                  onChange={(e) =>
                    editingStaffId
                      ? setStaffEditForm((current) => ({ ...current, role: e.target.value }))
                      : setStaffForm((current) => ({ ...current, role: e.target.value }))
                  }
                >
                  <option value="STUDENT_MANAGER">Student Manager</option>
                  <option value="SEO_EDITOR">SEO Editor</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="COURSE_MANAGER">Course Manager</option>
                  <option value="TEACHER">Teacher</option>
                </select>
                {editingStaffId ? (
                  <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={staffEditForm.status}
                    onChange={(e) => setStaffEditForm((current) => ({ ...current, status: e.target.value }))}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                ) : (
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={submitStaffInvite} disabled={staffSubmitting}>
                    {staffSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Invite
                  </Button>
                )}
              </CardContent>
              {editingStaffId && (
                <CardContent className="flex gap-2 pt-0">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={saveStaffEdit} disabled={staffSubmitting}>
                    {staffSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                    Save staff
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingStaffId(null);
                      setStaffEditForm({ name: "", role: "STUDENT_MANAGER", status: "PENDING" });
                    }}
                  >
                    Cancel
                  </Button>
                </CardContent>
              )}
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStaff.map((member) => (
                <Card key={member.id} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gray-900 p-3 text-white">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{member.name || member.email}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge className={member.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                        {member.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-900">Role:</span> {member.role.replaceAll("_", " ")}</p>
                      <p><span className="font-medium text-gray-900">Invited:</span> {formatDate(member.invitedAt)}</p>
                      <p><span className="font-medium text-gray-900">Last login:</span> {member.lastLogin ? formatDate(member.lastLogin) : "Never"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.permissions.slice(0, 4).map((permission) => (
                        <Badge key={permission} variant="outline" className="border-gray-200 text-gray-600">
                          {permission}
                        </Badge>
                      ))}
                      {member.permissions.length > 4 && (
                        <Badge variant="outline" className="border-gray-200 text-gray-600">
                          +{member.permissions.length - 4} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingStaffId(member.id);
                          setStaffEditForm({
                            name: member.name || "",
                            role: member.role,
                            status: member.status,
                          });
                        }}
                      >
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                <p className="text-sm text-gray-500">Recent admin-side changes and payment actions</p>
              </div>
              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                {auditLogs.length} recent entries
              </div>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Filter by actor email"
                    value={auditFilters.actor}
                    onChange={(e) => setAuditFilters((current) => ({ ...current, actor: e.target.value }))}
                  />
                  <Input
                    placeholder="Filter by entity"
                    value={auditFilters.entity}
                    onChange={(e) => setAuditFilters((current) => ({ ...current, entity: e.target.value }))}
                  />
                  <Input
                    placeholder="Filter by action"
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters((current) => ({ ...current, action: e.target.value }))}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Entity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actor</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">When</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((entry) => (
                        <tr key={entry.id} className="border-b align-top hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <ClipboardList className="h-4 w-4 text-gray-500" />
                              {entry.action}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <p>{entry.entity}</p>
                            <p className="text-xs text-gray-400">{entry.entityId}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <p>{entry.user.displayName || entry.user.email}</p>
                            <p className="text-xs text-gray-400">{entry.user.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(entry.createdAt)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            <pre className="max-w-md whitespace-pre-wrap break-words font-mono">
                              {JSON.stringify(entry.newValue ?? entry.oldValue ?? {}, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "announcements":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{announcementForm.id ? "Edit Announcement" : "Publish Announcement"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm((current) => ({ ...current, title: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm((current) => ({ ...current, type: e.target.value }))}
                    >
                      <option value="GENERAL">General</option>
                      <option value="BATCH">Batch</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <select
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={announcementForm.batchId}
                      onChange={(e) => setAnnouncementForm((current) => ({ ...current, batchId: e.target.value }))}
                    >
                      <option value="">All batches</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    className="min-h-[180px] w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Announcement content"
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm((current) => ({ ...current, content: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={saveAnnouncement} disabled={announcementSubmitting}>
                      {announcementSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                      {announcementForm.id ? "Update" : "Publish"}
                    </Button>
                    {announcementForm.id ? (
                      <Button
                        variant="outline"
                        onClick={() => setAnnouncementForm({ id: "", title: "", content: "", type: "GENERAL", batchId: "" })}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {filteredAnnouncements.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 text-center text-gray-500">No announcements published yet</CardContent>
                  </Card>
                ) : filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="bg-white border-0 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{announcement.title}</p>
                            <Badge variant="outline">{announcement.type}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {announcement.batchId
                              ? `Batch: ${batches.find((batch) => batch.id === announcement.batchId)?.name || announcement.batchId}`
                              : "Visible to all active students"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {announcement.publishedAt ? `Published ${formatDate(announcement.publishedAt)}` : `Created ${formatDate(announcement.createdAt)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAnnouncementForm({
                                id: announcement.id,
                                title: announcement.title,
                                content: announcement.content,
                                type: announcement.type,
                                batchId: announcement.batchId || "",
                              })
                            }
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteAnnouncement(announcement.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-gray-600">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{notificationForm.id ? "Edit Notification" : "Publish Notification"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm((current) => ({ ...current, title: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm((current) => ({ ...current, type: e.target.value }))}
                    >
                      <option value="INFO">Info</option>
                      <option value="SUCCESS">Success</option>
                      <option value="WARNING">Warning</option>
                      <option value="ACTION">Action</option>
                    </select>
                    <select
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={notificationForm.audience}
                      onChange={(e) => setNotificationForm((current) => ({ ...current, audience: e.target.value }))}
                    >
                      <option value="ALL_ACTIVE">All active</option>
                      <option value="PRE_ARRIVAL">Pre-arrival</option>
                      <option value="FULL">Full access</option>
                      <option value="ALUMNI">Alumni</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="rounded-lg border px-3 py-2 text-sm"
                      value={notificationForm.batchId}
                      onChange={(e) => setNotificationForm((current) => ({ ...current, batchId: e.target.value }))}
                    >
                      <option value="">All batches</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Student ID for individual"
                      value={notificationForm.studentId}
                      onChange={(e) => setNotificationForm((current) => ({ ...current, studentId: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Action URL"
                    value={notificationForm.actionUrl}
                    onChange={(e) => setNotificationForm((current) => ({ ...current, actionUrl: e.target.value }))}
                  />
                  <textarea
                    className="min-h-[180px] w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Notification message"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm((current) => ({ ...current, message: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={saveNotification} disabled={notificationSubmitting}>
                      {notificationSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                      {notificationForm.id ? "Update" : "Publish"}
                    </Button>
                    {notificationForm.id ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setNotificationForm({
                            id: "",
                            title: "",
                            message: "",
                            type: "INFO",
                            audience: "ALL_ACTIVE",
                            batchId: "",
                            studentId: "",
                            actionUrl: "",
                          })
                        }
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {filteredNotifications.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 text-center text-gray-500">No notifications published yet</CardContent>
                  </Card>
                ) : filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="bg-white border-0 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{notification.title}</p>
                            <Badge variant="outline">{notification.type}</Badge>
                            <Badge variant="outline">{notification.audience}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Published {notification.publishedAt ? formatDate(notification.publishedAt) : "draft"}
                            {notification.batchId ? ` • Batch ${notification.batchId}` : ""}
                            {notification.studentId ? ` • Student ${notification.studentId}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setNotificationForm({
                                id: notification.id,
                                title: notification.title,
                                message: notification.message,
                                type: notification.type,
                                audience: notification.audience,
                                batchId: notification.batchId || "",
                                studentId: notification.studentId || "",
                                actionUrl: notification.actionUrl || "",
                              })
                            }
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteNotification(notification.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-gray-700">{notification.message}</p>
                      {notification.actionUrl ? (
                        <a href={notification.actionUrl} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                          {notification.actionUrl}
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case "resources":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Pre-Arrival Resources</h1>
            <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{resourceForm.id ? "Edit Resource" : "Add Resource"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Title" value={resourceForm.title} onChange={(e) => setResourceForm((current) => ({ ...current, title: e.target.value }))} />
                  <Input placeholder="URL" value={resourceForm.url} onChange={(e) => setResourceForm((current) => ({ ...current, url: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="rounded-lg border px-3 py-2 text-sm" value={resourceForm.type} onChange={(e) => setResourceForm((current) => ({ ...current, type: e.target.value }))}>
                      <option value="LINK">Link</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="VIDEO">Video</option>
                      <option value="COMMUNITY">Community</option>
                    </select>
                    <select className="rounded-lg border px-3 py-2 text-sm" value={resourceForm.audience} onChange={(e) => setResourceForm((current) => ({ ...current, audience: e.target.value }))}>
                      <option value="PRE_ARRIVAL">Pre-arrival</option>
                      <option value="FULL">Full</option>
                      <option value="ALUMNI">Alumni</option>
                      <option value="ALL_ACTIVE">All active</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Task key (optional)" value={resourceForm.taskKey} onChange={(e) => setResourceForm((current) => ({ ...current, taskKey: e.target.value }))} />
                    <Input type="number" placeholder="Order" value={resourceForm.order} onChange={(e) => setResourceForm((current) => ({ ...current, order: e.target.value }))} />
                  </div>
                  <textarea
                    className="min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Description"
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm((current) => ({ ...current, description: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={resourceForm.isActive} onChange={(e) => setResourceForm((current) => ({ ...current, isActive: e.target.checked }))} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={saveResource} disabled={resourceSubmitting}>
                      {resourceSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                      {resourceForm.id ? "Update" : "Save"}
                    </Button>
                    {resourceForm.id ? (
                      <Button variant="outline" onClick={() => setResourceForm({ id: "", title: "", description: "", url: "", type: "LINK", audience: "PRE_ARRIVAL", taskKey: "", order: "0", isActive: true })}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {filteredResources.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 text-center text-gray-500">No pre-arrival resources configured yet</CardContent>
                  </Card>
                ) : filteredResources.map((resource) => (
                  <Card key={resource.id} className="bg-white border-0 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{resource.title}</p>
                            <Badge variant="outline">{resource.type}</Badge>
                            <Badge variant="outline">{resource.audience}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Order {resource.order}{resource.taskKey ? ` • Task ${resource.taskKey}` : ""} • {resource.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setResourceForm({
                                id: resource.id,
                                title: resource.title,
                                description: resource.description || "",
                                url: resource.url,
                                type: resource.type,
                                audience: resource.audience,
                                taskKey: resource.taskKey || "",
                                order: String(resource.order),
                                isActive: resource.isActive,
                              })
                            }
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteResource(resource.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      {resource.description ? <p className="text-sm leading-6 text-gray-600">{resource.description}</p> : null}
                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                        {resource.url}
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
                <p className="text-sm text-gray-500">Moderate alumni and student review submissions.</p>
              </div>
              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">{testimonials.length} submissions</div>
            </div>
            <div className="grid gap-4">
              {filteredTestimonials.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6 text-center text-gray-500">No testimonial submissions yet</CardContent>
                </Card>
              ) : filteredTestimonials.map((item) => (
                <Card key={item.id} className="bg-white border-0 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{item.student.name}</p>
                        <p className="text-sm text-gray-500">{item.student.email}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {[item.courseName, item.location, item.graduationYear].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <Badge className={item.status === "APPROVED" ? "bg-green-100 text-green-800" : item.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                        {item.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      {Array.from({ length: item.rating }).map((_, index) => (
                        <MessageCircle key={index} className="h-4 w-4" />
                      ))}
                    </div>
                    <p className="text-sm leading-6 text-gray-700">{item.quote}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-green-700" onClick={() => moderateTestimonial(item.id, "APPROVED")}>Approve</Button>
                      <Button variant="outline" className="text-red-700" onClick={() => moderateTestimonial(item.id, "REJECTED")}>Reject</Button>
                      <Button variant="outline" onClick={() => moderateTestimonial(item.id, "PENDING")}>Reset</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "batches":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
            <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Create Batch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select className="w-full rounded-lg border px-3 py-2 text-sm" value={batchForm.courseId} onChange={(e) => setBatchForm((current) => ({ ...current, courseId: e.target.value }))}>
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                  <Input placeholder="Batch name" value={batchForm.name} onChange={(e) => setBatchForm((current) => ({ ...current, name: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={batchForm.startDate} onChange={(e) => setBatchForm((current) => ({ ...current, startDate: e.target.value }))} />
                    <Input type="date" value={batchForm.endDate} onChange={(e) => setBatchForm((current) => ({ ...current, endDate: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Capacity" value={batchForm.capacity} onChange={(e) => setBatchForm((current) => ({ ...current, capacity: e.target.value }))} />
                    <select className="rounded-lg border px-3 py-2 text-sm" value={batchForm.status} onChange={(e) => setBatchForm((current) => ({ ...current, status: e.target.value }))}>
                      <option value="DRAFT">Draft</option>
                      <option value="OPEN">Open</option>
                      <option value="FULL">Full</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Regular price" value={batchForm.priceRegular} onChange={(e) => setBatchForm((current) => ({ ...current, priceRegular: e.target.value }))} />
                    <Input type="number" placeholder="Early bird" value={batchForm.priceEarlyBird} onChange={(e) => setBatchForm((current) => ({ ...current, priceEarlyBird: e.target.value }))} />
                  </div>
                  <Input type="date" value={batchForm.earlyBirdDeadline} onChange={(e) => setBatchForm((current) => ({ ...current, earlyBirdDeadline: e.target.value }))} />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={batchForm.waitlistEnabled} onChange={(e) => setBatchForm((current) => ({ ...current, waitlistEnabled: e.target.checked }))} />
                    Enable waitlist
                  </label>
                  <div className="space-y-3 rounded-xl border p-3">
                    <p className="text-sm font-medium text-gray-900">Accommodation pricing</p>
                    {batchForm.accommodation.map((item, index) => (
                      <div key={item.type} className="grid grid-cols-[1fr,100px,90px] gap-3 items-center">
                        <div className="text-sm font-medium text-gray-700">{item.type}</div>
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            setBatchForm((current) => ({
                              ...current,
                              accommodation: current.accommodation.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, price: e.target.value } : row,
                              ),
                            }))
                          }
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={item.mandatory}
                            onChange={(e) =>
                              setBatchForm((current) => ({
                                ...current,
                                accommodation: current.accommodation.map((row, rowIndex) =>
                                  rowIndex === index ? { ...row, mandatory: e.target.checked } : row,
                                ),
                              }))
                            }
                          />
                          Required
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={saveBatch} disabled={moduleSubmitting === "batch"}>
                    {moduleSubmitting === "batch" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                    {batchForm.id ? "Update batch" : "Save batch"}
                  </Button>
                </CardContent>
              </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {batches.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    No batches found
                  </CardContent>
                </Card>
              ) : batches.map((b) => (
                <Card key={b.id} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{b.name}</h3>
                        <p className="text-sm text-gray-500">{b.course?.name || b.name}</p>
                      </div>
                      <Badge className={b.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {b.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {formatDate(b.startDate)} - {formatDate(b.endDate)}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Enrolled</span>
                        <span className="font-medium">{b.enrolled}/{b.capacity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pricing</span>
                        <span className="font-medium">EUR {b.priceRegular}{b.priceEarlyBird ? ` / EUR ${b.priceEarlyBird}` : ""}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(b.enrolled / b.capacity) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(b.accommodation || []).map((item) => (
                          <Badge key={item.id} variant="outline" className="border-gray-200 text-gray-600">
                            {item.type}: EUR {item.price}{item.mandatory ? " required" : ""}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            setBatchForm({
                              id: b.id,
                              courseId: courseOptions.find((course) => course.name === b.course?.name)?.id || "",
                              name: b.name,
                              startDate: b.startDate.slice(0, 10),
                              endDate: b.endDate.slice(0, 10),
                              capacity: String(b.capacity),
                              priceRegular: String(b.priceRegular || 0),
                              priceEarlyBird: b.priceEarlyBird ? String(b.priceEarlyBird) : "",
                              earlyBirdDeadline: "",
                              status: b.status,
                              waitlistEnabled: Boolean(b.waitlistEnabled),
                              accommodation: (b.accommodation || []).map((item) => ({
                                type: item.type,
                                price: String(item.price),
                                mandatory: item.mandatory,
                              })),
                            })
                          }
                        >
                          <Pencil size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteBatch(b.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-sm font-semibold text-orange-900">Global settings are managed from the full settings page.</p>
                  <p className="mt-1 text-sm text-orange-800">
                    This dashboard card is a quick reference only, so admins do not edit a field here and expect a silent save.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">School</p>
                    <p className="mt-2 font-semibold text-gray-900">Bali YTTC</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Email</p>
                    <p className="mt-2 break-all font-semibold text-gray-900">info@baliyttc.com</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">WhatsApp</p>
                    <p className="mt-2 font-semibold text-gray-900">+62 819 9933 3327</p>
                  </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
                  <a href={`/${locale}/admin/settings`}>Open Full Settings</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "communications":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
                <p className="text-sm text-gray-500">Run reminders, review requests, and inspect delivery logs.</p>
              </div>
              <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                {communicationLogs.length} recent log entries
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
              {campaignCards.map((card) => {
                const queue = communicationQueues[card.key] || [];
                return (
                  <Card key={card.key} className="bg-white border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{card.title}</span>
                        <Badge variant="outline">{queue.length} queued</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-500">{card.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {queue.length === 0 ? (
                          <p className="text-sm text-gray-500">No eligible recipients right now.</p>
                        ) : queue.slice(0, 4).map((recipient) => (
                          <div key={recipient.key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{recipient.name}</p>
                                <p className="text-xs text-gray-500">{recipient.email}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {recipient.courseName}
                                  {recipient.batchName ? ` • ${recipient.batchName}` : ""}
                                </p>
                              </div>
                              <Badge variant="outline">{recipient.channels.join(", ")}</Badge>
                            </div>
                            {recipient.daysUntilStart !== null ? (
                              <p className="mt-2 text-xs text-gray-500">Starts in {recipient.daysUntilStart} days</p>
                            ) : null}
                            {recipient.daysSinceEnd !== null && recipient.campaign === "REVIEW_REQUEST" ? (
                              <p className="mt-2 text-xs text-gray-500">Batch ended {recipient.daysSinceEnd} days ago</p>
                            ) : null}
                          </div>
                        ))}
                        {queue.length > 4 ? (
                          <p className="text-xs text-gray-500">+{queue.length - 4} more recipients ready.</p>
                        ) : null}
                      </div>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={campaignRunning === card.key || queue.length === 0}
                        onClick={() => runCommunicationCampaign(card.key)}
                      >
                        {campaignRunning === card.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Run campaign
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent delivery log</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {communicationLogs.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No communication activity yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-6 py-3">Campaign</th>
                          <th className="px-6 py-3">Channel</th>
                          <th className="px-6 py-3">Recipient</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communicationLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-b-0">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.campaign.replaceAll("_", " ").toLowerCase()}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{log.channel.toLowerCase()}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div>{log.recipientEmail || "-"}</div>
                              {log.recipientPhone ? <div className="text-xs text-gray-400">{log.recipientPhone}</div> : null}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={log.status === "SENT" ? "bg-green-100 text-green-800" : log.status === "SKIPPED" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                                {log.status.toLowerCase()}
                              </Badge>
                              {log.error ? <p className="mt-1 text-xs text-red-500">{log.error}</p> : null}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(log.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security</h1>
              <p className="mt-1 text-sm text-gray-500">Manage authenticator-based protection for admin access.</p>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {twoFactorStatus?.enabled
                      ? "Your admin login currently requires a 6-digit authenticator code."
                      : "Set up a TOTP authenticator app to protect admin access."}
                  </p>
                </div>
                <Badge className={twoFactorStatus?.enabled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                  {twoFactorStatus?.enabled ? "enabled" : "disabled"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={twoFactorLoading}
                    onClick={() => handleTwoFactorAction("generate")}
                  >
                    {twoFactorLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {twoFactorStatus?.enabled ? "Regenerate setup" : "Generate setup"}
                  </Button>
                  {twoFactorStatus?.enabled && (
                    <Button
                      variant="outline"
                      disabled={twoFactorLoading || twoFactorCode.length !== 6}
                      onClick={() => handleTwoFactorAction("disable")}
                    >
                      Disable 2FA
                    </Button>
                  )}
                </div>

                {twoFactorQr && (
                  <div className="grid gap-6 md:grid-cols-[260px,1fr]">
                    <div className="rounded-2xl border bg-gray-50 p-4">
                      <img src={twoFactorQr} alt="Authenticator setup QR code" className="h-60 w-60 rounded-lg" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Manual entry key</p>
                        <p className="mt-2 rounded-lg border bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                          {twoFactorSecret}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Verification code</p>
                        <Input
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="mt-2 max-w-xs"
                        />
                      </div>
                      <Button
                        className="bg-gray-900 hover:bg-black text-white"
                        disabled={twoFactorLoading || twoFactorCode.length !== 6}
                        onClick={() => handleTwoFactorAction("verify_setup")}
                      >
                        Confirm and enable 2FA
                      </Button>
                    </div>
                  </div>
                )}

                {twoFactorStatus?.enabled && !twoFactorQr && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Disable with current code</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="max-w-xs"
                      />
                      <Button
                        variant="outline"
                        disabled={twoFactorLoading || twoFactorCode.length !== 6}
                        onClick={() => handleTwoFactorAction("disable")}
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default: // overview
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening with Bali YTTC.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <Card key={m.label} className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${m.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className={`flex items-center text-sm font-medium ${m.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                          {m.trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          {m.change}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{m.value}</h3>
                      <p className="text-sm text-gray-500 mt-1">{m.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Recent Enrollments</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 w-48"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredEnrollments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No enrollments found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEnrollments.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                            {e.name?.split(' ').map(n => n[0]).join('') || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{e.name}</p>
                            <p className="text-sm text-gray-500">{e.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(e.amount)}</p>
                            <p className="text-sm text-gray-500 uppercase">{e.courseSlug}</p>
                          </div>
                          <Badge className={statusColors[e.paymentStatus] || statusColors.pending}>
                            {getStatusLabel(e.paymentStatus)}
                          </Badge>
                          <Button size="sm" variant="ghost"><Eye size={16} /></Button>
                          <Button size="sm" variant="ghost"><Mail size={16} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
    }
  };

  return renderContent();
}
