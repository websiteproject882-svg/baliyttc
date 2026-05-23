import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/social-proof/route";
const mocks = vi.hoisted(() => ({
  getSocialProofStats: vi.fn(),
  logApiError: vi.fn(),
}));

const fallbackStats = {
  totalGraduates: 2500,
  yearsExperience: 12,
  averageRating: 4.9,
  totalReviews: 600,
  countries: 70,
  trainingHours: 50000,
  certifiedTeachers: 2200,
};

vi.mock("@/lib/social-proof", () => {
  return {
    getSocialProofStats: mocks.getSocialProofStats,
  };
});

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request() {
  return new NextRequest("https://example.com/api/social-proof", {
    method: "GET",
    headers: {
      "x-request-id": "req_public_social_proof",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSocialProofStats.mockResolvedValue({
    stats: fallbackStats,
    computedStats: fallbackStats,
  });
});

describe("public social proof route", () => {
  it("returns public social proof stats", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_social_proof");
    expect(body).toEqual({ stats: fallbackStats });
  });

  it("logs failures without leaking internals", async () => {
    mocks.getSocialProofStats.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch social proof");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "socialProof.public",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });
});
