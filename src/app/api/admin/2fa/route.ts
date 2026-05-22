import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { generateTotpQrDataUrl, generateTotpSecret, verifyTotpToken } from "@/lib/totp";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const twoFactorActionSchema = z.object({
  action: z.enum(["generate", "verify_setup", "disable"]),
  code: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { staff: true },
  });

  if (!currentUser?.staff) {
    return jsonWithRequestId({ error: "Staff account not found" }, { status: 404 }, request);
  }

  return jsonWithRequestId({
    enabled: currentUser.staff.totpEnabled,
    hasSecret: Boolean(currentUser.staff.totpSecret),
  }, undefined, request);
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  try {
    const { action, code } = twoFactorActionSchema.parse(await request.json());
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: true },
    });

    if (!currentUser?.staff) {
      return jsonWithRequestId({ error: "Staff account not found" }, { status: 404 }, request);
    }

    if (action === "generate") {
      const { secret, otpauthUrl } = generateTotpSecret(currentUser.email);
      const qrCodeDataUrl = await generateTotpQrDataUrl(otpauthUrl);

      await prisma.staff.update({
        where: { id: currentUser.staff.id },
        data: {
          totpSecret: secret,
          totpEnabled: false,
        },
      });

      return jsonWithRequestId({
        success: true,
        manualEntryKey: secret,
        qrCodeDataUrl,
      }, undefined, request);
    }

    if (!currentUser.staff.totpSecret) {
      return jsonWithRequestId({ error: "2FA secret is not set up yet" }, { status: 400 }, request);
    }

    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) {
      return jsonWithRequestId({ error: "Missing authentication code" }, { status: 400 }, request);
    }

    if (action === "verify_setup") {
      const valid = verifyTotpToken(currentUser.staff.totpSecret, normalizedCode);
      if (!valid) {
        return jsonWithRequestId({ error: "Invalid authentication code" }, { status: 401 }, request);
      }

      await prisma.staff.update({
        where: { id: currentUser.staff.id },
        data: { totpEnabled: true },
      });

      await writeAuditLog({
        actorUserId: user.id,
        action: "staff.2fa_enabled",
        entity: "staff",
        entityId: currentUser.staff.id,
        newValue: { totpEnabled: true },
        request,
      });

      return jsonWithRequestId({ success: true, enabled: true }, undefined, request);
    }

    if (action === "disable") {
      const valid = verifyTotpToken(currentUser.staff.totpSecret, normalizedCode);
      if (!valid) {
        return jsonWithRequestId({ error: "Invalid authentication code" }, { status: 401 }, request);
      }

      await prisma.staff.update({
        where: { id: currentUser.staff.id },
        data: {
          totpEnabled: false,
          totpSecret: null,
        },
      });

      await writeAuditLog({
        actorUserId: user.id,
        action: "staff.2fa_disabled",
        entity: "staff",
        entityId: currentUser.staff.id,
        oldValue: { totpEnabled: true },
        newValue: { totpEnabled: false },
        request,
      });

      return jsonWithRequestId({ success: true, enabled: false }, undefined, request);
    }

    return jsonWithRequestId({ error: "Unsupported 2FA action" }, { status: 400 }, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
        request,
      );
    }
    logApiError("admin.2fa", error, request);
    return jsonWithRequestId({ error: "Failed to process 2FA action" }, { status: 500 }, request);
  }
}
