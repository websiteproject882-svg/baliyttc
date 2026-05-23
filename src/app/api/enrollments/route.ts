import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin } from "@/lib/authz";
import { sendEnrollmentConfirmationEmail, sendAdminNotificationEmail, isGmailConfigured } from "@/lib/gmail-smtp";
import { sendEnrollmentConfirmation, sendAdminEnrollmentNotification } from "@/lib/resend";
import { sendEnrollmentConfirmationWhatsApp, sendWelcomeWhatsApp } from "@/lib/whatsapp";
import { resolveEnrollmentPricing } from "@/lib/payments/enrollment-pricing";
import { createRateLimitResponse, getClientIp, jsonWithRequestId, logApiError, rateLimit } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";

const enrollmentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  course: z.string(),
  batchId: z.string().optional(),
  accommodation: z.enum(["SHARED", "PRIVATE"]).default("SHARED"),
  paymentType: z.enum(["DEPOSIT", "FULL"]).default("DEPOSIT"),
  amount: z.number().optional(),
  currency: z.string().default("USD"),
  couponCode: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
  referralSource: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("enrollments.view");
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const course = searchParams.get("course");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.paymentStatus = status.toUpperCase();
    if (course) where.courseSlug = course;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
            },
          },
          student: {
            select: {
              id: true,
              completedHours: true,
              totalHours: true,
              certificateIssued: true,
              certificates: {
                orderBy: { issuedAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  certificateId: true,
                  status: true,
                  issuedAt: true,
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              method: true,
              status: true,
              amount: true,
              currency: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET enrollments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `public:enrollments:${getClientIp(request)}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: "Too many enrollment attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const body = await request.json();
    const data = enrollmentSchema.parse(body);
    const settings = await getSiteSettings();
    const currency = settings.payments.displayCurrencyPrimary;
    const pricing = await resolveEnrollmentPricing({
      courseSlug: data.course,
      batchId: data.batchId,
      accommodation: data.accommodation,
      couponCode: data.couponCode,
      email: data.email,
    });
    const finalAmount = data.paymentType === "DEPOSIT" ? pricing.depositAmount : pricing.totalAmount;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          displayName: data.name,
          uid: `user-${Date.now()}`,
          role: "STUDENT",
        },
      });
    }

    // Find or create student record
    let student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          userId: user.id,
          phone: data.phone,
        },
      });
    }

    const existingPendingEnrollment = await prisma.enrollment.findFirst({
      where: {
        email: data.email,
        courseSlug: data.course,
        batchId: data.batchId ?? null,
        paymentStatus: "PENDING",
      },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPendingEnrollment) {
      const enrollment = await prisma.enrollment.update({
        where: { id: existingPendingEnrollment.id },
        data: {
          studentId: student.id,
          accommodation: data.accommodation,
          name: data.name,
          phone: data.phone,
          preferredDate: data.preferredDate,
          message: data.message,
          paymentType: data.paymentType,
          amount: finalAmount,
          currency,
          couponCode: pricing.appliedCouponCode || data.couponCode,
          discount: pricing.discount,
          referralSource: data.referralSource,
        },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
            },
          },
        },
      });

      return jsonWithRequestId({
        success: true,
        enrollment,
        duplicate: true,
        message: "Existing pending enrollment found. Complete payment to unlock access.",
      }, undefined, request);
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        studentId: student.id,
        courseSlug: data.course,
        batchId: data.batchId,
        accommodation: data.accommodation,
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferredDate: data.preferredDate,
        message: data.message,
        paymentType: data.paymentType,
        paymentStatus: "PENDING",
        amount: finalAmount,
        currency,
        couponCode: pricing.appliedCouponCode || data.couponCode,
        discount: pricing.discount,
        referralSource: data.referralSource,
        accessLevel: "NONE",
      },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Get batch info for emails
    let batchName = data.preferredDate || "TBD";
    if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
      });
      if (batch) {
        batchName = batch.name;
      }
    }

    // Get course info
    const course = await prisma.course.findUnique({
      where: { slug: data.course },
    });
    const courseName = course?.name || data.course;

    // Send confirmation email to student (async, don't wait)
    // Use Gmail if configured, otherwise use Resend
    if (isGmailConfigured()) {
      sendEnrollmentConfirmationEmail({
        name: data.name,
        email: data.email,
        course: courseName,
        batch: batchName || "TBD",
        amount: finalAmount,
        currency,
        paymentType: data.paymentType === "DEPOSIT" ? "deposit" : "full",
      }).catch(console.error);
    } else {
      sendEnrollmentConfirmation({
        name: data.name,
        email: data.email,
        course: courseName,
        batch: batchName,
        amount: finalAmount,
        currency,
        paymentType: data.paymentType === "DEPOSIT" ? "deposit" : "full",
      }).catch(console.error);
    }

    // Send admin notification (async, don't wait)
    if (settings.notifications.emailOnEnrollment) {
      if (isGmailConfigured()) {
        sendAdminNotificationEmail({
          type: "enrollment",
          name: data.name,
          email: data.email,
          course: `${courseName} - ${batchName || "TBD"}`,
        }).catch(console.error);
      } else {
        sendAdminEnrollmentNotification({
          name: data.name,
          email: data.email,
          phone: data.phone,
          course: courseName,
          batch: batchName,
          amount: finalAmount,
          currency,
          paymentType: data.paymentType === "DEPOSIT" ? "deposit" : "full",
        }).catch(console.error);
      }
    }

    // Send WhatsApp notification to student (async, don't wait)
    sendEnrollmentConfirmationWhatsApp({
      name: data.name,
      phone: data.phone,
      course: courseName,
      batch: batchName,
    }).catch(console.error);

    // Send welcome WhatsApp to admin (async, don't wait)
    if (settings.notifications.whatsappOnEnrollment) {
      sendWelcomeWhatsApp({
        name: data.name,
        phone: data.phone,
        course: courseName,
      }).catch(console.error);
    }

    return jsonWithRequestId({
      success: true,
      enrollment,
      message: "Enrollment created. Complete payment to unlock access.",
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
        request,
      );
    }
    logApiError("enrollments.create", error, request);
    return jsonWithRequestId(
      { error: "Failed to create enrollment" },
      { status: 500 },
      request,
    );
  }
}
