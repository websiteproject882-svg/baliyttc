import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { auth } from '@/lib/firebase-admin';
import { createSession, createTwoFactorChallenge, AuthType } from '@/lib/session';
import prisma from '@/lib/prisma';
import { getRoleHomePath, isStaffRole } from '@/lib/rbac';
import { getClientIp, jsonWithRequestId, logApiError, rateLimit, requireSameOrigin } from '@/lib/security';

const loginSchema = z.object({
  idToken: z.string().trim().min(1).max(20_000),
});

function normalizeAuthPhotoUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.startsWith("data:image/") || /^https:\/\//.test(trimmed) ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `auth:staff:login:${getClientIp(request)}`,
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
      include: { staff: true },
    });
    const userByEmail = await prisma.user.findUnique({
      where: { email },
      include: { staff: true },
    });

    if (userByUid && userByEmail && userByUid.id !== userByEmail.id) {
      return jsonWithRequestId(
        { error: 'This Firebase account is linked to a different staff email.' },
        { status: 409 },
        request,
      );
    }

    const user = userByEmail || userByUid;

    // Check if user exists
    if (!user) {
      return jsonWithRequestId(
        { error: 'Account not found. Please contact the admin.' },
        { status: 401 },
        request,
      );
    }

    // Check if user is a staff member with valid role
    if (!user.staff) {
      return jsonWithRequestId(
        { error: 'Staff account not found. Please contact the admin.' },
        { status: 403 },
        request,
      );
    }

    // SUPER_ADMIN should use admin login, not staff login
    if (user.staff.role === 'SUPER_ADMIN') {
      return jsonWithRequestId(
        { error: 'Please use the Admin login page for owner access.' },
        { status: 403 },
        request,
      );
    }

    // Check if role is allowed for staff portal
    if (!isStaffRole(user.staff.role)) {
      return jsonWithRequestId(
        { error: 'Access denied. Valid staff role required.' },
        { status: 403 },
        request,
      );
    }

    // Check if staff status is ACTIVE (this is the toggle!)
    if (user.staff.status !== 'ACTIVE') {
      const statusMessages = {
        PENDING: 'Your account is pending activation. The admin needs to approve your access.',
        INACTIVE: 'Your account has been deactivated. Please contact the admin.',
      };
      return jsonWithRequestId(
        { error: statusMessages[user.staff.status as keyof typeof statusMessages] || 'Account is not active.' },
        { status: 403 },
        request,
      );
    }

    const role = user.staff.role;

    // Update profile data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        uid: decodedToken.uid,
        email,
        displayName: decodedToken.name?.trim() || email.split("@")[0] || null,
        photoURL: normalizeAuthPhotoUrl(decodedToken.picture),
      },
    });

    // Check 2FA for staff
    if (user.staff.totpEnabled && user.staff.totpSecret) {
      const challengeToken = await createTwoFactorChallenge(user.id, role, email, 'staff');
      return jsonWithRequestId({
        success: true,
        requiresTwoFactor: true,
        challengeToken,
        role,
        authType: 'staff' as AuthType,
        redirectTo: getRoleHomePath(role),
      }, undefined, request);
    }

    await prisma.staff.update({
      where: { id: user.staff.id },
      data: { lastLogin: new Date() },
    });

    await createSession(user.id, role, email, 'staff');

    return jsonWithRequestId({
      success: true,
      role,
      permissions: (user.staff.permissions as string[] | null) ?? [],
      authType: 'staff' as AuthType,
      redirectTo: getRoleHomePath(role),
      requiresTotpSetup: !user.staff.totpEnabled,
    }, undefined, request);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: 'Invalid login request' }, { status: 400 }, request);
    }
    logApiError('auth.staff.login', error, request);
    return jsonWithRequestId({ error: 'Internal server error' }, { status: 500 }, request);
  }
}
