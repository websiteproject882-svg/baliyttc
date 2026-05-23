import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { auth } from '@/lib/firebase-admin';
import { createSession, createTwoFactorChallenge, AuthType } from '@/lib/session';
import prisma from '@/lib/prisma';
import { getRoleHomePath, isAdminPanelRole } from '@/lib/rbac';
import { createRateLimitResponse, getClientIp, jsonWithRequestId, logApiError, rateLimit, requireSameOrigin } from '@/lib/security';

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  try {
    const limit = rateLimit({
      key: `auth:admin:login:${getClientIp(request)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return jsonWithRequestId({ error: 'Missing ID token' }, { status: 400 }, request);
    }

    if (!auth) {
      return jsonWithRequestId({ error: 'Firebase admin is not configured' }, { status: 503 }, request);
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email || "";

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
        { error: 'This Firebase account is linked to a different admin email.' },
        { status: 409 },
        request,
      );
    }

    const user = userByEmail || userByUid;

    // Check if user exists
    if (!user) {
      return jsonWithRequestId(
        { error: 'Account not found. Please contact the owner.' },
        { status: 401 },
        request,
      );
    }

    // Check if user is a staff member with SUPER_ADMIN role
    if (!user.staff || user.staff.role !== 'SUPER_ADMIN') {
      return jsonWithRequestId(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 },
        request,
      );
    }

    // Check if staff status is ACTIVE
    if (user.staff.status !== 'ACTIVE') {
      return jsonWithRequestId(
        { error: `Your account is ${user.staff.status.toLowerCase()}. Please contact the owner.` },
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
        displayName: decodedToken.name || decodedToken.email?.split("@")[0] || null,
        photoURL: decodedToken.picture || null,
      },
    });

    // Check 2FA for admin
    if (user.staff.totpEnabled && user.staff.totpSecret) {
      const challengeToken = await createTwoFactorChallenge(user.id, role, email, 'admin');
      return jsonWithRequestId({
        success: true,
        requiresTwoFactor: true,
        challengeToken,
        role,
        authType: 'admin' as AuthType,
        redirectTo: getRoleHomePath(role),
      }, undefined, request);
    }

    await prisma.staff.update({
      where: { id: user.staff.id },
      data: { lastLogin: new Date() },
    });

    await createSession(user.id, role, email, 'admin');

    return jsonWithRequestId({
      success: true,
      role,
      authType: 'admin' as AuthType,
      redirectTo: getRoleHomePath(role),
      requiresTotpSetup: !user.staff.totpEnabled,
    }, undefined, request);

  } catch (error) {
    logApiError('auth.admin.login', error, request);
    return jsonWithRequestId({ error: 'Internal server error' }, { status: 500 }, request);
  }
}
