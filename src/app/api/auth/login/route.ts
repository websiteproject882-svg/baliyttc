import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { auth } from '@/lib/firebase-admin';
import { createSession, AuthType } from '@/lib/session';
import prisma from '@/lib/prisma';
import { getRoleHomePath, type AppRole } from '@/lib/rbac';
import { getClientIp, jsonWithRequestId, logApiError, rateLimit, requireSameOrigin } from '@/lib/security';

const loginSchema = z.object({
  idToken: z.string().trim().min(1).max(20_000),
});

const accessRank = {
  NONE: 0,
  PRE_ARRIVAL: 1,
  FULL: 2,
  ALUMNI: 3,
} as const;

function normalizeAuthPhotoUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.startsWith("data:image/") || /^https:\/\//.test(trimmed) ? trimmed : null;
}

function accessFromPaymentStatus(status: string) {
  if (status === "FULL_PAID") return "FULL";
  if (status === "DEPOSIT_PAID") return "PRE_ARRIVAL";
  return "NONE";
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `auth:login:${getClientIp(request)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: 'Invalid login request' }, { status: 400 }, request);
    }
    const { idToken } = parsed.data;

    if (!auth) {
      return jsonWithRequestId({ error: 'Firebase admin is not configured' }, { status: 503 }, request);
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email?.trim().toLowerCase() || "";

    if (!email) {
      return jsonWithRequestId({ error: 'Firebase account is missing an email' }, { status: 400 }, request);
    }

    const userByUid = await prisma.user.findUnique({
      where: { uid: decodedToken.uid },
      include: { staff: true, student: true },
    });
    const userByEmail = await prisma.user.findUnique({
      where: { email },
      include: { staff: true, student: true },
    });

    if (userByUid && userByEmail && userByUid.id !== userByEmail.id) {
      return jsonWithRequestId(
        { error: 'This Firebase account is linked to a different portal email. Use the email used during payment.' },
        { status: 409 },
        request,
      );
    }

    const profileData = {
      email,
      displayName: decodedToken.name?.trim() || email.split("@")[0] || null,
      photoURL: normalizeAuthPhotoUrl(decodedToken.picture),
    };

    const user = userByEmail
      ? await prisma.user.update({
          where: { id: userByEmail.id },
          data: {
            uid: decodedToken.uid,
            ...profileData,
          },
          include: { staff: true, student: true },
        })
      : await prisma.user.upsert({
          where: { uid: decodedToken.uid },
          update: profileData,
          create: {
            uid: decodedToken.uid,
            ...profileData,
            role: 'STUDENT',
          },
          include: {
            staff: true,
            student: true,
          },
        });

    let syncedStudent = user.student;
    if (!syncedStudent && !user.staff) {
      syncedStudent = await prisma.student.create({
        data: {
          userId: user.id,
        },
      });
    }

    if (syncedStudent && !user.staff) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          OR: [
            { userId: user.id },
            { email },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const bestEnrollment = enrollments.reduce<(typeof enrollments)[number] | null>((best, enrollment) => {
        if (!best) return enrollment;
        const currentAccess = accessFromPaymentStatus(enrollment.paymentStatus);
        const bestAccess = accessFromPaymentStatus(best.paymentStatus);
        if (accessRank[currentAccess] > accessRank[bestAccess]) return enrollment;
        return best;
      }, null);

      if (bestEnrollment) {
        const bestBatch = bestEnrollment.batchId
          ? await prisma.batch.findUnique({
              where: { id: bestEnrollment.batchId },
              include: { course: { select: { name: true } } },
            })
          : null;
        const enrollmentAccess = accessFromPaymentStatus(bestEnrollment.paymentStatus);
        const nextAccess =
          accessRank[syncedStudent.accessLevel] >= accessRank[enrollmentAccess]
            ? syncedStudent.accessLevel
            : enrollmentAccess;

        syncedStudent = await prisma.student.update({
          where: { id: syncedStudent.id },
          data: {
            batchId: bestEnrollment.batchId || syncedStudent.batchId,
            enrolledCourse: bestBatch?.course?.name || syncedStudent.enrolledCourse,
            enrollmentDate: bestEnrollment.createdAt,
            paymentStatus: bestEnrollment.paymentStatus,
            accessLevel: nextAccess,
            phone: syncedStudent.phone || bestEnrollment.phone,
          },
        });
      }
    }

    // SECURITY: Block staff/admin/teachers from student portal
    if (user.staff?.status === 'ACTIVE') {
      const staffRole = user.staff.role;
      const isAdminRole = staffRole === 'SUPER_ADMIN';
      return jsonWithRequestId({
        error: 'Access denied. ' + (isAdminRole
          ? 'Please use the Admin Portal to login.'
          : 'Please use the Staff Portal to login.'),
        isStaffAccount: true,
        isAdminRole,
        redirectTo: isAdminRole ? '/en/admin/login' : '/en/staff/login',
      }, { status: 403 }, request);
    }

    let role: AppRole = user.role as AppRole;
    let permissions: string[] = [];

    // Only students can login via student portal
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return jsonWithRequestId({
        error: 'Access denied. Admin accounts must use the Admin Portal.',
        isAdminAccount: true,
        redirectTo: '/en/admin/login',
      }, { status: 403 }, request);
    }

    await createSession(user.id, role, email, 'student');

    return jsonWithRequestId({
      success: true,
      role,
      permissions,
      authType: 'student' as AuthType,
      redirectTo: getRoleHomePath(role),
      isAdmin: false,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: 'Invalid login request' }, { status: 400 }, request);
    }
    logApiError('auth.login', error, request);
    return jsonWithRequestId({ error: 'Internal server error' }, { status: 500 }, request);
  }
}
