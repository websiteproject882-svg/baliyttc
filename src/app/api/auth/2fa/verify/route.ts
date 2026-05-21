import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, decrypt, AuthType } from "@/lib/session";
import { getRoleHomePath } from "@/lib/rbac";
import { verifyTotpToken } from "@/lib/totp";
import { createRateLimitResponse, getClientIp, jsonWithRequestId, logApiError, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit({
      key: `auth:2fa:${getClientIp(request)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: "Too many 2FA attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
        request,
      );
    }

    const { challengeToken, code } = await request.json();

    if (!challengeToken || !code) {
      return jsonWithRequestId({ error: "Missing 2FA challenge or code" }, { status: 400 }, request);
    }

    const challenge = await decrypt(challengeToken);
    if (!challenge || challenge.purpose !== "2fa" || !challenge.userId) {
      return jsonWithRequestId({ error: "Invalid or expired 2FA challenge" }, { status: 401 }, request);
    }

    const user = await prisma.user.findUnique({
      where: { id: String(challenge.userId) },
      include: { staff: true },
    });

    if (!user?.staff || !user.staff.totpEnabled || !user.staff.totpSecret) {
      return jsonWithRequestId({ error: "2FA is not configured for this account" }, { status: 400 }, request);
    }

    const valid = verifyTotpToken(user.staff.totpSecret, String(code).trim());
    if (!valid) {
      return jsonWithRequestId({ error: "Invalid authentication code" }, { status: 401 }, request);
    }

    await prisma.staff.update({
      where: { id: user.staff.id },
      data: { lastLogin: new Date() },
    });

    const authType = (challenge.authType as AuthType) || 'student';
    await createSession(user.id, String(challenge.role), user.email, authType);

    return jsonWithRequestId({
      success: true,
      role: challenge.role,
      authType,
      redirectTo: getRoleHomePath(String(challenge.role)),
    }, undefined, request);
  } catch (error) {
    logApiError("auth.2fa.verify", error, request);
    return jsonWithRequestId({ error: "Two-factor verification failed" }, { status: 500 }, request);
  }
}
