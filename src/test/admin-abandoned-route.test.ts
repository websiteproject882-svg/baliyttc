import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, POST } from "../app/api/admin/abandoned/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
  getCommunicationDashboardData: vi.fn(),
  runCommunicationCampaign: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    siteSetting: {
      findUnique: mocks.siteSettingFindUnique,
      upsert: mocks.siteSettingUpsert,
    },
  },
}));

vi.mock("@/lib/communications", () => ({
  getCommunicationDashboardData: mocks.getCommunicationDashboardData,
  runCommunicationCampaign: mocks.runCommunicationCampaign,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: ["communications.view", "communications.send"],
  authType: "admin",
};

const settings = {
  enabled: true,
  reminder1Hours: 2,
  reminder2Hours: 48,
  reminder3Days: 5,
  emailTemplates: {
    reminder1: "Hey {{name}}, finish {{course}} here: {{link}}",
    reminder2: "Hi {{name}}, your {{course}} spot is waiting: {{link}}",
    reminder3: "Last reminder for {{course}}, {{name}}: {{link}}",
  },
};

function request(method: "GET" | "PATCH" | "POST", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/abandoned", {
    method,
    headers: {
      "x-request-id": "req_admin_abandoned",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.siteSettingFindUnique.mockResolvedValue({ key: "abandoned_enrollment_settings", value: settings });
  mocks.siteSettingUpsert.mockResolvedValue({ key: "abandoned_enrollment_settings", value: settings });
  mocks.getCommunicationDashboardData.mockResolvedValue({
    queues: {
      ABANDONED_ENROLLMENT: [
        {
          key: "abandoned:enrollment_1",
          enrollmentId: "enrollment_1",
          name: "Riya Sharma",
          email: "riya@example.com",
          courseName: "200 Hour YTT",
          batchStartDate: new Date("2026-06-01T00:00:00.000Z"),
          daysUntilStart: 9,
        },
      ],
    },
    recentLogs: [
      {
        campaign: "ABANDONED_ENROLLMENT",
        metadata: { enrollmentId: "enrollment_1" },
      },
    ],
  });
  mocks.runCommunicationCampaign.mockResolvedValue({ sent: 1, failed: 0 });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin abandoned enrollment route", () => {
  it("lists abandoned enrollments with settings, reminder counts, and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_abandoned");
    expect(mocks.requirePermission).toHaveBeenCalledWith("communications.view");
    expect(mocks.siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: "abandoned_enrollment_settings" },
    });
    expect(body.settings).toEqual(settings);
    expect(body.abandoned).toEqual([
      {
        id: "abandoned:enrollment_1",
        enrollmentId: "enrollment_1",
        name: "Riya Sharma",
        email: "riya@example.com",
        courseSlug: "200 Hour YTT",
        lastActivity: "2026-06-01T00:00:00.000Z",
        remindersSent: 1,
        status: "pending",
        key: "abandoned:enrollment_1",
        daysUntilStart: 9,
      },
    ]);
  });

  it("falls back to default settings when stored settings are invalid", async () => {
    mocks.siteSettingFindUnique.mockResolvedValue({ key: "abandoned_enrollment_settings", value: { enabled: true } });

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.settings.enabled).toBe(false);
    expect(body.settings.reminder1Hours).toBe(1);
  });

  it("saves settings with numeric string coercion and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", {
      ...settings,
      reminder1Hours: "3",
      reminder2Hours: "72",
      reminder3Days: "7",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("communications.send");
    expect(mocks.siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: "abandoned_enrollment_settings" },
      create: {
        key: "abandoned_enrollment_settings",
        value: expect.objectContaining({
          reminder1Hours: 3,
          reminder2Hours: 72,
          reminder3Days: 7,
        }),
      },
      update: {
        value: expect.objectContaining({
          reminder1Hours: 3,
          reminder2Hours: 72,
          reminder3Days: 7,
        }),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "abandoned.settings_updated",
        entity: "site_settings",
        entityId: "abandoned_enrollment_settings",
      }),
    );
  });

  it("validates settings payloads", async () => {
    const response = await PATCH(request("PATCH", {
      ...settings,
      reminder1Hours: 0,
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.siteSettingUpsert).not.toHaveBeenCalled();
  });

  it("sends one manual reminder and writes an audit log", async () => {
    const response = await POST(request("POST", { key: "abandoned:enrollment_1" }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true, result: { sent: 1, failed: 0 } });
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledWith({
      campaign: "ABANDONED_ENROLLMENT",
      recipientKeys: ["abandoned:enrollment_1"],
      limit: undefined,
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "abandoned.reminder_sent",
        entity: "communication_campaign",
        entityId: "abandoned:enrollment_1",
      }),
    );
  });

  it("sends a limited batch when no key is provided", async () => {
    await POST(request("POST"));

    expect(mocks.runCommunicationCampaign).toHaveBeenCalledWith({
      campaign: "ABANDONED_ENROLLMENT",
      recipientKeys: undefined,
      limit: 25,
    });
  });

  it("logs list failures without leaking internals", async () => {
    mocks.getCommunicationDashboardData.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to fetch abandoned enrollments");
    expect(mocks.logApiError).toHaveBeenCalledWith("admin.abandoned.list", expect.any(Error), expect.any(NextRequest));
  });

  it("logs campaign failures without leaking internals", async () => {
    mocks.runCommunicationCampaign.mockRejectedValue(new Error("provider down"));

    const response = await POST(request("POST", { key: "abandoned:enrollment_1" }));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to send abandoned reminder");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.abandoned.send",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
