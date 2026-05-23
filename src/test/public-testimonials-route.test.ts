import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/testimonials/route";

const mocks = vi.hoisted(() => ({
  testimonialFindMany: vi.fn(),
  testimonialAggregate: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    testimonial: {
      findMany: mocks.testimonialFindMany,
      aggregate: mocks.testimonialAggregate,
    },
  },
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request(url = "https://example.com/api/testimonials?limit=6") {
  return new NextRequest(url, { headers: { "x-request-id": "req_public_testimonials" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.testimonialFindMany.mockResolvedValue([
    {
      id: "testimonial_1",
      courseName: null,
      quote: "A careful and supportive training.",
      rating: 5,
      location: "Germany",
      graduationYear: 2026,
      student: {
        enrolledCourse: "200 Hour YTTC",
        user: { displayName: "Maya" },
      },
    },
  ]);
  mocks.testimonialAggregate.mockResolvedValue({
    _avg: { rating: 4.8 },
    _count: { id: 12 },
  });
});

describe("public testimonials route", () => {
  it("returns approved testimonials without selecting student email", async () => {
    const response = await GET(request("https://example.com/api/testimonials?limit=500"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_testimonials");
    expect(mocks.testimonialFindMany).toHaveBeenCalledWith({
      where: { status: "APPROVED" },
      select: {
        id: true,
        courseName: true,
        quote: true,
        rating: true,
        location: true,
        graduationYear: true,
        student: {
          select: {
            enrolledCourse: true,
            user: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    expect(body).toEqual({
      testimonials: [
        {
          id: "testimonial_1",
          name: "Maya",
          course: "200 Hour YTTC",
          quote: "A careful and supportive training.",
          rating: 5,
          location: "Germany",
          graduationYear: 2026,
        },
      ],
      stats: {
        averageRating: 4.8,
        totalApproved: 12,
      },
    });
  });

  it("falls back to default limit for invalid values", async () => {
    await GET(request("https://example.com/api/testimonials?limit=bad"));

    expect(mocks.testimonialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 6,
      }),
    );
  });

  it("logs failures without leaking internals", async () => {
    mocks.testimonialFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch testimonials");
    expect(mocks.logApiError).toHaveBeenCalledWith("testimonials.public", expect.any(Error), expect.any(NextRequest));
  });
});
