import { CommunicationCampaign } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/cron/communications/route";

const originalEnv = { ...process.env };

const mocks = vi.hoisted(() => ({
  runCommunicationCampaign: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/communications", () => ({
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

function request(method: "GET" | "POST", body?: unknown, headers?: Record<string, string>) {
  return new NextRequest("https://example.com/api/cron/communications", {
    method,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_cron",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function rawRequest(body: string, headers?: Record<string, string>) {
  return new NextRequest("https://example.com/api/cron/communications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_cron",
      ...headers,
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv, CRON_SECRET: "cron-secret-123456" };
  mocks.runCommunicationCampaign.mockImplementation(({ campaign }: { campaign: CommunicationCampaign }) =>
    Promise.resolve({ campaign, sent: 1, skipped: 0 }),
  );
});

describe("communications cron route", () => {
  it("rejects unauthorized requests before running campaigns", async () => {
    const response = await POST(request("POST", { campaign: "PAYMENT_REMINDER" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mocks.runCommunicationCampaign).not.toHaveBeenCalled();
  });

  it("runs a single requested campaign via bearer auth", async () => {
    const response = await POST(
      request("POST", { campaign: "PAYMENT_REMINDER", limit: 5 }, { authorization: "Bearer cron-secret-123456" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledTimes(1);
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledWith({ campaign: "PAYMENT_REMINDER", limit: 5 });
    expect(body.success).toBe(true);
    expect(body.results).toEqual([{ campaign: "PAYMENT_REMINDER", sent: 1, skipped: 0 }]);
  });

  it("runs the default campaign set for authenticated GET cron calls", async () => {
    const response = await GET(request("GET", undefined, { "x-cron-secret": "cron-secret-123456" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledTimes(3);
    expect(mocks.runCommunicationCampaign).toHaveBeenNthCalledWith(1, { campaign: "PAYMENT_REMINDER", limit: undefined });
    expect(mocks.runCommunicationCampaign).toHaveBeenNthCalledWith(2, { campaign: "PREPARATION_REMINDER", limit: undefined });
    expect(mocks.runCommunicationCampaign).toHaveBeenNthCalledWith(3, { campaign: "REVIEW_REQUEST", limit: undefined });
    expect(body.results).toHaveLength(3);
  });

  it("rejects invalid payloads without running campaigns", async () => {
    const response = await POST(
      request("POST", { campaign: "PAYMENT_REMINDER", limit: 101 }, { "x-cron-secret": "cron-secret-123456" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.runCommunicationCampaign).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON without running default campaigns", async () => {
    const response = await POST(rawRequest("{not-valid-json", { "x-cron-secret": "cron-secret-123456" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("X-Request-Id")).toBe("req_cron");
    expect(body.error).toBe("Validation failed");
    expect(mocks.runCommunicationCampaign).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("runs the default campaign set for authenticated empty POST cron calls", async () => {
    const response = await POST(rawRequest("", { "x-cron-secret": "cron-secret-123456" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.runCommunicationCampaign).toHaveBeenCalledTimes(3);
    expect(body.results).toHaveLength(3);
  });

  it("logs unexpected campaign failures", async () => {
    mocks.runCommunicationCampaign.mockRejectedValue(new Error("provider down"));

    const response = await POST(
      request("POST", { campaign: "PAYMENT_REMINDER" }, { "x-cron-secret": "cron-secret-123456" }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to execute communication cron" });
    expect(mocks.logApiError).toHaveBeenCalledWith("cron.communications", expect.any(Error), expect.any(NextRequest));
  });
});
