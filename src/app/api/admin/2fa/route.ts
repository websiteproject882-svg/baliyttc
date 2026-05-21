import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { generateTotpQrDataUrl, generateTotpSecret, verifyTotpToken } from "@/lib/totp";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireAdminUser();
  if (!user || response) {
    return response;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { staff: true },
  });

  if (!currentUser?.staff) {
    return NextResponse.json({ error: "Staff account not found" }, { status: 404 });
  }

  return NextResponse.json({
    enabled: currentUser.staff.totpEnabled,
    hasSecret: Boolean(currentUser.staff.totpSecret),
  });
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
    const { action, code } = await request.json();
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: true },
    });

    if (!currentUser?.staff) {
      return NextResponse.json({ error: "Staff account not found" }, { status: 404 });
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

      return NextResponse.json({
        success: true,
        manualEntryKey: secret,
        qrCodeDataUrl,
      });
    }

    if (!currentUser.staff.totpSecret) {
      return NextResponse.json({ error: "2FA secret is not set up yet" }, { status: 400 });
    }

    if (action === "verify_setup") {
      const valid = verifyTotpToken(currentUser.staff.totpSecret, String(code || "").trim());
      if (!valid) {
        return NextResponse.json({ error: "Invalid authentication code" }, { status: 401 });
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

      return NextResponse.json({ success: true, enabled: true });
    }

    if (action === "disable") {
      const valid = verifyTotpToken(currentUser.staff.totpSecret, String(code || "").trim());
      if (!valid) {
        return NextResponse.json({ error: "Invalid authentication code" }, { status: 401 });
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

      return NextResponse.json({ success: true, enabled: false });
    }

    return NextResponse.json({ error: "Unsupported 2FA action" }, { status: 400 });
  } catch (error) {
    console.error("POST admin 2FA error:", error);
    return NextResponse.json({ error: "Failed to process 2FA action" }, { status: 500 });
  }
}
