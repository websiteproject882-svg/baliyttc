import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/logout/route";

const mocks = vi.hoisted(() => ({
  destroySession: vi.fn(),
  requireSameOrigin: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  destroySession: mocks.destroySession,
}));

vi.mock("@/lib/authz", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
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
  return new NextRequest("https://example.com/api/auth/logout", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      host: "example.com",
      "x-request-id": "req_logout",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.destroySession.mockResolvedValue(undefined);
});

describe("auth logout route", () => {
  it("requires same-origin requests before destroying sessions", async () => {
    const forbidden = Response.json({ error: "Forbidden" }, { status: 403 });
    mocks.requireSameOrigin.mockReturnValue(forbidden);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.destroySession).not.toHaveBeenCalled();
  });

  it("destroys all portal sessions and returns a request-id response", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_logout");
    expect(body).toEqual({ success: true });
    expect(mocks.destroySession).toHaveBeenCalledWith();
  });

  it("logs unexpected failures without exposing internals", async () => {
    mocks.destroySession.mockRejectedValue(new Error("cookie write failed"));

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(mocks.logApiError).toHaveBeenCalledWith("auth.logout", expect.any(Error), expect.any(NextRequest));
  });
});
