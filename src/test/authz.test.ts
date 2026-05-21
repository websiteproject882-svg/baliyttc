import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireSameOrigin } from "../lib/security";

describe("same-origin guard", () => {
  it("allows requests from same origin", () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: {
        origin: "https://example.com",
        host: "example.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(requireSameOrigin(request)).toBeNull();
  });

  it("rejects requests from other origins", async () => {
    const request = new NextRequest("https://example.com/api/test", {
      headers: {
        origin: "https://evil.com",
        host: "example.com",
        "x-forwarded-proto": "https",
      },
    });

    const response = requireSameOrigin(request);
    expect(response?.status).toBe(403);
  });
});
