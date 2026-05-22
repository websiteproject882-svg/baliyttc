import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "@/lib/authz";

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

export async function GET(request: NextRequest) {
  const { response } = await requireAdminUser();
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    const ranges: Record<string, Date> = {
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      year: new Date(now.getFullYear(), 0, 1),
    };
    const startDate = ranges[period] || ranges.month;

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

    return NextResponse.json({
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
        NONE: await prisma.student.count({ where: { accessLevel: "NONE" } }),
        PRE_ARRIVAL: await prisma.student.count({ where: { accessLevel: "PRE_ARRIVAL" } }),
        FULL: await prisma.student.count({ where: { accessLevel: "FULL" } }),
        ALUMNI: await prisma.student.count({ where: { accessLevel: "ALUMNI" } }),
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
        utilization: Math.round((b.enrolled / b.capacity) * 100),
        status: b.status,
      })),
      topBatches,
      leads: leadsStats.map((l: StatCount) => ({ status: l.status, count: l._count })),
      waitlist: waitlistStats.map((w: StatCount) => ({ status: w.status, count: w._count })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
