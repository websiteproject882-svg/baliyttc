import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/health/route";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getCurrentUser: vi.fn(),
  validateRuntimeEnv: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: mocks.queryRaw,
  },
}));

vi.mock("@/lib/authz", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/env-validation", () => ({
  validateRuntimeEnv: mocks.validateRuntimeEnv,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request() {
  return new NextRequest("https://example.com/api/health", {
    headers: { "x-request-id": "req_health" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.validateRuntimeEnv.mockReturnValue({ ok: true, warnings: [], errors: [] });
});

describe("health route", () => {
  it("returns a non-cached public health response without diagnostics", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Request-Id")).toBe("req_health");
    expect(body.status).toBe("ok");
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.durationMs).toEqual(expect.any(Number));
    expect(body.checks).toBeUndefined();
    expect(body.providers).toBeUndefined();
    expect(mocks.getCurrentUser).toHaveBeenCalledWith("admin");
    expect(mocks.queryRaw).toHaveBeenCalled();
  });

  it("includes diagnostics only for super admins", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin_1",
      role: "SUPER_ADMIN",
    });
    mocks.validateRuntimeEnv.mockReturnValue({
      ok: true,
      warnings: ["optional warning"],
      errors: [],
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checks).toEqual({ database: "ok", env: "ok" });
    expect(body.providers).toEqual(
      expect.objectContaining({
        razorpay: expect.any(String),
        paypal: expect.any(String),
        email: expect.any(String),
        whatsapp: expect.any(String),
      }),
    );
    expect(body.warnings).toEqual(["optional warning"]);
    expect(body.errors).toEqual([]);
  });

  it("marks health as degraded when database check fails and logs the failure", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual(
      expect.objectContaining({
        status: "degraded",
      }),
    );
    expect(body.checks).toBeUndefined();
    expect(mocks.logApiError).toHaveBeenCalledWith("health.database", expect.any(Error), expect.any(NextRequest));
  });

  it("marks health as degraded when required environment validation fails", async () => {
    mocks.validateRuntimeEnv.mockReturnValue({
      ok: false,
      warnings: [],
      errors: ["SESSION_SECRET is required"],
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.errors).toBeUndefined();
  });
});
