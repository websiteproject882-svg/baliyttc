import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

interface CourseStat {
  courseSlug: string;
  _count: number;
  _sum: { amount: number | null } | null;
}

interface EnrollmentSource {
  referralSource: string | null;
  _count: number;
}

interface EnrollmentStatus {
  paymentStatus: string;
  _count: number;
}

interface BatchUtilization {
  name: string;
  capacity: number;
  enrolled: number;
  status: string;
}

interface TopBatch {
  name: string;
  enrolled: number;
  capacity: number;
}

interface StatCount {
  status: string | null;
  _count: number;
}

interface MonthlyEnrollment {
  amount: number;
  createdAt: Date;
}

const periodSchema = z
  .enum(["day", "week", "month", "year", "7d", "30d", "90d", "1y", "all"])
  .default("month");

type AnalyticsPeriod = z.infer<typeof periodSchema>;

function getStartDate(period: AnalyticsPeriod, now: Date) {
  const ranges: Record<AnalyticsPeriod, Date> = {
    day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getFullYear(), now.getMonth(), 1),
    year: new Date(now.getFullYear(), 0, 1),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    "1y": new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
    all: new Date(0),
  };

  return ranges[period];
}

export async function GET(request: NextRequest) {
  const { user, response } = await requirePermission("analytics.revenue");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = periodSchema.parse(searchParams.get("period") || undefined);

    const now = new Date();
    const startDate = getStartDate(period, now);

    const [
      totalEnrollments,
      totalStudents,
      totalRevenueResult,
      recentEnrollments,
      courseStats,
      enrollmentsForMonth,
      enrollmentBySource,
      enrollmentByStatus,
      batchUtilization,
      topBatches,
      leadsStats,
      waitlistStats,
      noneAccessCount,
      preArrivalAccessCount,
      fullAccessCount,
      alumniAccessCount,
    ] = await Promise.all([
      prisma.enrollment.count(),
      prisma.student.count({
        where: { accessLevel: { in: ["PRE_ARRIVAL", "FULL"] } },
      }),
      prisma.enrollment.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] } },
      }),
      prisma.enrollment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true, displayName: true } } },
      }),
      prisma.enrollment.groupBy({
        by: ["courseSlug"],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.enrollment.findMany({
        where: {
          paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.enrollment.groupBy({
        by: ["referralSource"],
        _count: true,
      }),
      prisma.enrollment.groupBy({
        by: ["paymentStatus"],
        _count: true,
      }),
      prisma.batch.findMany({
        where: { startDate: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } },
        select: { name: true, capacity: true, enrolled: true, status: true },
      }),
      prisma.batch.findMany({
        orderBy: { enrolled: "desc" },
        take: 5,
        select: { name: true, enrolled: true, capacity: true },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.waitlist.groupBy({ by: ["status"], _count: true }),
      prisma.student.count({ where: { accessLevel: "NONE" } }),
      prisma.student.count({ where: { accessLevel: "PRE_ARRIVAL" } }),
      prisma.student.count({ where: { accessLevel: "FULL" } }),
      prisma.student.count({ where: { accessLevel: "ALUMNI" } }),
    ]);

    const monthlyRevenue: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = 0;
    }

    enrollmentsForMonth.forEach((e: MonthlyEnrollment) => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += e.amount;
      }
    });

    const periodEnrollments = await prisma.enrollment.count({
      where: { createdAt: { gte: startDate } },
    });
    const periodRevenue = await prisma.enrollment.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] },
        createdAt: { gte: startDate },
      },
    });

    const currentMonthRevenue = await prisma.enrollment.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: { in: ["DEPOSIT_PAID", "FULL_PAID"] },
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });

    return jsonWithRequestId({
      stats: {
        totalEnrollments,
        totalStudents,
        totalRevenue: totalRevenueResult._sum.amount || 0,
        upcomingBatches: topBatches.length,
        monthlyRevenue: currentMonthRevenue._sum.amount || 0,
        revenueChange: 0,
        enrollmentChange: 0,
      },
      overview: {
        totalEnrollments,
        totalStudents,
        totalRevenue: totalRevenueResult._sum.amount || 0,
        periodRevenue: periodRevenue._sum.amount || 0,
        periodEnrollments,
        period,
      },
      courses: courseStats.map((c: CourseStat) => ({
        course: c.courseSlug,
        count: c._count,
        revenue: c._sum?.amount || 0,
      })),
      enrollmentsByCourse: courseStats.map((c: CourseStat) => ({
        course: c.courseSlug,
        count: c._count,
        revenue: c._sum?.amount || 0,
      })),
      revenueByMonth: Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .reverse(),
      enrollmentsByMonth: Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue, count: 0 }))
        .reverse(),
      enrollmentBySource: enrollmentBySource
        .filter((s: EnrollmentSource) => s.referralSource)
        .map((s: EnrollmentSource) => ({ source: s.referralSource, count: s._count })),
      enrollmentByStatus: enrollmentByStatus.map((s: EnrollmentStatus) => ({
        status: s.paymentStatus,
        count: s._count,
      })),
      paymentStatusBreakdown: Object.fromEntries(
        enrollmentByStatus.map((s: EnrollmentStatus) => [s.paymentStatus, s._count]),
      ),
      accessLevelBreakdown: {
        NONE: noneAccessCount,
        PRE_ARRIVAL: preArrivalAccessCount,
        FULL: fullAccessCount,
        ALUMNI: alumniAccessCount,
      },
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        id: enrollment.id,
        name: enrollment.name,
        email: enrollment.email,
        course: enrollment.courseSlug,
        amount: enrollment.amount,
        status: enrollment.paymentStatus,
        date: enrollment.createdAt,
      })),
      batchUtilization: batchUtilization.map((b: BatchUtilization) => ({
        name: b.name,
        enrolled: b.enrolled,
        capacity: b.capacity,
        utilization: b.capacity > 0 ? Math.round((b.enrolled / b.capacity) * 100) : 0,
        status: b.status,
      })),
      topBatches,
      leads: leadsStats.map((l: StatCount) => ({ status: l.status, count: l._count })),
      waitlist: waitlistStats.map((w: StatCount) => ({ status: w.status, count: w._count })),
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.analytics.summary", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to fetch analytics" }, { status: 500 }, request);
  }
}
