import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/admin/communications/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  getCommunicationDashboardData: vi.fn(),
  runCommunicationCampaign: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
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

const queues = {
  PAYMENT_REMINDER: [
    {
      key: "payment:enrollment_1",
      campaign: "PAYMENT_REMINDER",
      name: "Asha",
      email: "asha@example.com",
      courseName: "200 Hour YTT",
      batchName: "June 2026",
      daysUntilStart: 7,
      daysSinceEnd: null,
      accessLevel: "PRE_ARRIVAL",
      paymentStatus: "DEPOSIT_PAID",
    },
  ],
};

const recentLogs = [
  {
    id: "log_1",
    campaign: "PAYMENT_REMINDER",
    channel: "EMAIL",
    recipientEmail: "asha@example.com",
    recipientPhone: null,
    status: "SENT",
    error: null,
    createdAt: new Date("2026-05-20T00:00:00.000Z"),
  },
];

function request(method: "GET" | "POST", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/communications", {
    method,
    headers: {
      "x-request-id": "req_admin_communications",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST", body: string) {
  return new NextRequest("https://example.com/api/admin/communications", {
    method,
    headers: {
      "x-request-id": "req_admin_communications",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.getCommunicationDashboardData.mockResolvedValue({ queues, recentLogs });
  mocks.runCommunicationCampaign.mockResolvedValue({
    campaign: "PAYMENT_REMINDER",
    sent: 1,
    failed: 0,
    skipped: 0,
    results: [{ key: "payment:enrollment_1", status: "SENT" }],
  });
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin communications route", () => {
  it("loads dashboard queues and logs with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_communications");
    expect(body).toEqual({
      queues,
      logs: [
        {
          ...recentLogs[0],
          createdAt: "2026-05-20T00:00:00.000Z",
        },
      ],
    });
    expect(mocks.requirePermission).toHaveBeenCalledWith("communications.view");
  });

  it("runs communication campaigns with coerced limits and writes an audit log", async () => {
    const response = await POST(request("POST", {
      campaign: "PAYMENT_REMINDER",
      recipientKeys: ["payment:enrollment_1"],
      limit: "25",
    }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.sent).toBe(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("communications.send");
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledWith({
      campaign: "PAYMENT_REMINDER",
      recipientKeys: ["payment:enrollment_1"],
      limit: 25,
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "communications.run",
        entity: "communication_campaign",
        entityId: "PAYMENT_REMINDER",
      }),
    );
  });

  it("validates campaign payloads", async () => {
    const response = await POST(request("POST", {
      campaign: "NOT_REAL",
      limit: 500,
    }));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.runCommunicationCampaign).not.toHaveBeenCalled();
  });

  it("rejects malformed campaign JSON before sending", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_communications");
    expect(body.error).toBe("Validation failed");
    expect(mocks.runCommunicationCampaign).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("logs dashboard failures without leaking internals", async () => {
    mocks.getCommunicationDashboardData.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to load communications");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.communications.dashboard",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });

  it("logs campaign failures without leaking internals", async () => {
    mocks.runCommunicationCampaign.mockRejectedValue(new Error("provider down"));

    const response = await POST(request("POST", { campaign: "PAYMENT_REMINDER" }));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to run communication campaign");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.communications.run",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
