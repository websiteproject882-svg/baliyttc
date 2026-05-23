import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, decrypt } from "@/lib/session";
import { getRoleHomePath } from "@/lib/rbac";
import { verifyTotpToken } from "@/lib/totp";
import { getClientIp, jsonWithRequestId, logApiError, rateLimit, requireSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const STAFF_PORTAL_ROLES = new Set(["TEACHER", "SEO_EDITOR", "FINANCE_MANAGER", "COURSE_MANAGER"]);

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

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

    if (!user?.staff) {
      return jsonWithRequestId({ error: "Staff account not found" }, { status: 403 }, request);
    }

    if (user.staff.status !== "ACTIVE") {
      return jsonWithRequestId({ error: "Account is not active" }, { status: 403 }, request);
    }

    const authType = challenge.authType === "admin" || challenge.authType === "staff" ? challenge.authType : null;
    if (!authType) {
      return jsonWithRequestId({ error: "Invalid 2FA challenge type" }, { status: 401 }, request);
    }

    if (authType === "admin" && user.staff.role !== "SUPER_ADMIN") {
      return jsonWithRequestId({ error: "Admin privileges required" }, { status: 403 }, request);
    }

    if (authType === "staff" && !STAFF_PORTAL_ROLES.has(user.staff.role)) {
      return jsonWithRequestId({ error: "Valid staff role required" }, { status: 403 }, request);
    }

    if (!user.staff.totpEnabled || !user.staff.totpSecret) {
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

    const role = user.staff.role;
    await createSession(user.id, role, user.email, authType);

    return jsonWithRequestId({
      success: true,
      role,
      authType,
      redirectTo: getRoleHomePath(role),
    }, undefined, request);
  } catch (error) {
    logApiError("auth.2fa.verify", error, request);
    return jsonWithRequestId({ error: "Two-factor verification failed" }, { status: 500 }, request);
  }
}
