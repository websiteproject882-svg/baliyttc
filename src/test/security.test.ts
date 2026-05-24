import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  applyDeprecationHeaders,
  createApiErrorResponse,
  createRateLimitResponse,
  getRequestId,
  jsonWithRequestId,
  LEGACY_API_SUNSET,
  rateLimit,
  requireSameOrigin,
} from "../lib/security";

describe("security helpers", () => {
  it("enforces in-memory rate limits within window", () => {
    const key = `test:${Date.now()}`;
    const first = rateLimit({ key, limit: 2, windowMs: 60_000 });
    const second = rateLimit({ key, limit: 2, windowMs: 60_000 });
    const third = rateLimit({ key, limit: 2, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("preserves x-request-id on JSON responses", () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-request-id": "req-123" },
    });

    const response = jsonWithRequestId({ ok: true }, undefined, request);
    expect(response.headers.get("X-Request-Id")).toBe("req-123");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("creates request ids when the header is missing", () => {
    const request = new NextRequest("http://localhost:3000/api/test");
    expect(getRequestId(request)).toMatch(/[0-9a-f-]{20,}/i);
  });

  it("applies deprecation, replacement, warning, and sunset headers", () => {
    const request = new NextRequest("http://localhost:3000/api/test");
    const response = applyDeprecationHeaders(jsonWithRequestId({ ok: true }, undefined, request), {
      replacement: "/api/admin/example",
      sunset: LEGACY_API_SUNSET,
      message: "Use /api/admin/example instead.",
    });

    expect(response.headers.get("X-API-Deprecated")).toBe("true");
    expect(response.headers.get("X-API-Replacement")).toBe("/api/admin/example");
    expect(response.headers.get("Sunset")).toBe(LEGACY_API_SUNSET);
    expect(response.headers.get("Warning")).toBe('299 - "Use /api/admin/example instead."');
  });

  it("adds request id and hardening headers to API error responses", async () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: { "x-request-id": "req-error" },
    });

    const response = createApiErrorResponse("Forbidden", 403, request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(response.headers.get("X-Request-Id")).toBe("req-error");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("adds request ids to same-origin and rate-limit failures", () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: {
        "x-request-id": "req-guard",
        origin: "https://evil.com",
        host: "example.com",
        "x-forwarded-proto": "https",
      },
    });

    const originResponse = requireSameOrigin(request);
    const rateLimitResponse = createRateLimitResponse("Slow down", 30, request);

    expect(originResponse?.headers.get("X-Request-Id")).toBe("req-guard");
    expect(rateLimitResponse.headers.get("X-Request-Id")).toBe("req-guard");
    expect(rateLimitResponse.headers.get("Retry-After")).toBe("30");
  });
});
