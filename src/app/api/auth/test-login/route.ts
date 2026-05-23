import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { getRoleHomePath, isAdminPanelRole, type AppRole } from "@/lib/rbac";
import { getClientIp, jsonWithRequestId, rateLimit, requireSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function expectedPassword(email: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (email === "admin@baliyttc.com" || email === "owner@baliyttc.com") {
    return [
      process.env.TEST_ADMIN_PASSWORD,
      isDevelopment ? "admin123" : null,
      isDevelopment ? "password" : null,
    ].filter(Boolean);
  }

  if (email === "student@test.com") {
    return [
      process.env.TEST_STUDENT_PASSWORD,
      isDevelopment ? "student123" : null,
    ].filter(Boolean);
  }

  if (email === "teacher@test.com") {
    return [
      process.env.TEST_TEACHER_PASSWORD,
      isDevelopment ? "teacher123" : null,
    ].filter(Boolean);
  }

  return null;
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  const productionTestLoginAllowed =
    process.env.NODE_ENV !== "production" || process.env.ALLOW_PRODUCTION_TEST_LOGIN === "true";

  if (process.env.ENABLE_TEST_LOGIN !== "true" || !productionTestLoginAllowed) {
    return jsonWithRequestId({ error: "Test login is disabled" }, { status: 404 }, request);
  }

  const limit = rateLimit({
    key: `auth:test-login:${getClientIp(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.allowed) {
    return jsonWithRequestId({ error: "Too many login attempts. Try again later." }, { status: 429 }, request);
  }

  try {
    const { email, password } = schema.parse(await request.json());
    const normalizedEmail = email.toLowerCase();
    const expectedPasswords = expectedPassword(normalizedEmail);

    if (!expectedPasswords?.includes(password)) {
      return jsonWithRequestId({ error: "Invalid credentials" }, { status: 401 }, request);
    }

    const lookupEmail = normalizedEmail === "owner@baliyttc.com" ? "admin@baliyttc.com" : normalizedEmail;
    const user = await prisma.user.findUnique({
      where: { email: lookupEmail },
      include: { staff: true, student: true },
    });

    if (!user) {
      return jsonWithRequestId({ error: "User not found" }, { status: 404 }, request);
    }

    if (normalizedEmail === "student@test.com") {
      if (!user.student || user.student.accessLevel === "NONE") {
        return jsonWithRequestId({ error: "Student access is not active" }, { status: 403 }, request);
      }
    }

    if (normalizedEmail === "teacher@test.com") {
      if (!user.staff || user.staff.status !== "ACTIVE") {
        return jsonWithRequestId({ error: "Teacher access is not active" }, { status: 403 }, request);
      }
    }

    if ((normalizedEmail === "admin@baliyttc.com" || normalizedEmail === "owner@baliyttc.com")) {
      if (!user.staff || user.staff.role !== "SUPER_ADMIN" || user.staff.status !== "ACTIVE") {
        return jsonWithRequestId({ error: "Admin access is not active" }, { status: 403 }, request);
      }
    }

    const role: AppRole = user.staff?.status === "ACTIVE" ? (user.staff.role as AppRole) : (user.role as AppRole);
    const authType = role === "SUPER_ADMIN"
      ? "admin"
      : role === "TEACHER"
        ? "staff"
        : "student";

    if (user.staff?.status === "ACTIVE") {
      await prisma.staff.update({
        where: { id: user.staff.id },
        data: { lastLogin: new Date() },
      });
    }

    await createSession(user.id, role, user.email, authType);

    return jsonWithRequestId({
      success: true,
      role,
      authType,
      redirectTo: getRoleHomePath(role),
      isAdmin: isAdminPanelRole(role) || role === "ADMIN",
      testLogin: true,
    }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    console.error("test login error:", error);
    return jsonWithRequestId({ error: "Failed to login" }, { status: 500 }, request);
  }
}
