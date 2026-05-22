import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../app/api/admin/settings/route";
import { defaultSiteSettings, normalizePaymentProviderOrder, siteSettingsSchema } from "../lib/site-settings";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  getPaymentProviderReadiness: vi.fn(),
  getSiteSettings: vi.fn(),
  saveSiteSettings: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/payments/readiness", () => ({
  getPaymentProviderReadiness: mocks.getPaymentProviderReadiness,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    siteSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/site-settings", async () => {
  const actual = await vi.importActual<typeof import("../lib/site-settings")>("../lib/site-settings");
  return {
    ...actual,
    getSiteSettings: mocks.getSiteSettings,
    saveSiteSettings: mocks.saveSiteSettings,
  };
});

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("../lib/security")>("../lib/security");
  return {
    ...actual,
    logApiError: mocks.logApiError,
  };
});

function request(method: "GET" | "PATCH", body?: unknown) {
  return new NextRequest("https://example.com/api/admin/settings", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_settings_test",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function json(response: Response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireSuperAdmin.mockResolvedValue({
    user: { id: "admin_1", email: "admin@example.com", role: "SUPER_ADMIN" },
    response: null,
  });
  mocks.writeAuditLog.mockResolvedValue({});
  mocks.getPaymentProviderReadiness.mockReturnValue({
    paypal: { checkoutReady: false },
    razorpay: { checkoutReady: false },
    bankTransfer: { checkoutReady: true },
  });
  mocks.getSiteSettings.mockResolvedValue(defaultSiteSettings);
  mocks.saveSiteSettings.mockResolvedValue(defaultSiteSettings);
});

describe("site settings schema", () => {
  it("rejects duplicate or incomplete payment provider order", () => {
    expect(
      siteSettingsSchema.safeParse({
        ...defaultSiteSettings,
        payments: {
          ...defaultSiteSettings.payments,
          providerOrder: ["paypal", "paypal", "bank_transfer"],
        },
      }).success,
    ).toBe(false);

    expect(
      siteSettingsSchema.safeParse({
        ...defaultSiteSettings,
        payments: {
          ...defaultSiteSettings.payments,
          providerOrder: ["paypal", "razorpay"],
        },
      }).success,
    ).toBe(false);
  });

  it("normalizes legacy payment provider order values without losing known providers", () => {
    expect(normalizePaymentProviderOrder(["razorpay", "paypal", "razorpay", "legacy"])).toEqual([
      "razorpay",
      "paypal",
      "bank_transfer",
    ]);
    expect(normalizePaymentProviderOrder(["bank_transfer"])).toEqual([
      "bank_transfer",
      "paypal",
      "razorpay",
    ]);
    expect(normalizePaymentProviderOrder(null)).toEqual(["paypal", "razorpay", "bank_transfer"]);
  });
});

describe("admin settings route", () => {
  it("returns current settings and provider readiness", async () => {
    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_settings_test");
    expect(await json(response)).toEqual({
      settings: defaultSiteSettings,
      providers: {
        paypal: { checkoutReady: false },
        razorpay: { checkoutReady: false },
        bankTransfer: { checkoutReady: true },
      },
    });
  });

  it("saves valid settings and writes an audit log", async () => {
    const nextSettings = {
      ...defaultSiteSettings,
      payments: {
        ...defaultSiteSettings.payments,
        bankTransferEnabled: false,
      },
    };
    mocks.saveSiteSettings.mockResolvedValue(nextSettings);

    const response = await PATCH(request("PATCH", nextSettings));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      settings: nextSettings,
      providers: {
        paypal: { checkoutReady: false },
        razorpay: { checkoutReady: false },
        bankTransfer: { checkoutReady: true },
      },
    });
    expect(mocks.saveSiteSettings).toHaveBeenCalledWith(nextSettings);
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "settings.updated",
        entity: "site_settings",
        entityId: "site_settings",
      }),
    );
  });

  it("rejects invalid settings payloads", async () => {
    const response = await PATCH(
      request("PATCH", {
        ...defaultSiteSettings,
        general: { ...defaultSiteSettings.general, email: "bad-email" },
      }),
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error).toBe("Invalid settings payload");
    expect(mocks.saveSiteSettings).not.toHaveBeenCalled();
  });

  it("logs and returns request-id errors when saving fails", async () => {
    mocks.saveSiteSettings.mockRejectedValue(new Error("database offline"));

    const response = await PATCH(request("PATCH", defaultSiteSettings));

    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-Id")).toBe("req_settings_test");
    expect(await json(response)).toEqual({ error: "Failed to save settings" });
    expect(mocks.logApiError).toHaveBeenCalledWith("admin.settings", expect.any(Error), expect.any(NextRequest));
  });
});
