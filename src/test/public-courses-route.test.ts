import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/courses/route";

const mocks = vi.hoisted(() => ({
  courseFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findMany: mocks.courseFindMany,
    },
  },
}));

vi.mock("@/data/site", () => ({
  COURSES: [
    {
      slug: "50hr",
      title: "50 Hour YTT",
      duration: "50 Hours",
      days: "6 Days",
      summary: "Short course",
      priceFrom: 499,
      image: "/course.jpg",
      modules: [],
    },
  ],
  BATCHES: [],
}));

vi.mock("@/lib/localized-content", () => ({
  normalizeLocale: (locale: string | null) => locale || "en",
  applyCourseTranslation: (course: Record<string, unknown>) => course,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request(url = "https://example.com/api/courses?locale=en") {
  return new NextRequest(url, { headers: { "x-request-id": "req_public_courses" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.courseFindMany.mockResolvedValue([
    {
      id: "course_1",
      slug: "200hr",
      name: "200 Hour YTT",
      priceFrom: 1499,
      modules: [],
      batches: [],
    },
  ]);
});

describe("public courses route", () => {
  it("only exposes open future batches from active courses", async () => {
    const response = await GET(request("https://example.com/api/courses?slug=200hr&locale=en"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_courses");
    expect(mocks.courseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          slug: "200hr",
        },
        include: expect.objectContaining({
          batches: expect.objectContaining({
            where: {
              status: "OPEN",
              endDate: { gte: expect.any(Date) },
            },
          }),
        }),
      }),
    );
    expect(body.courses).toHaveLength(1);
  });

  it("uses static fallback when a slug is not found", async () => {
    mocks.courseFindMany.mockResolvedValue([]);

    const response = await GET(request("https://example.com/api/courses?slug=50hr&locale=en"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.courses).toEqual([expect.objectContaining({ slug: "50hr", name: "50 Hour YTT" })]);
  });

  it("rejects invalid slugs before querying", async () => {
    const response = await GET(request("https://example.com/api/courses?slug=Bad Slug!&locale=en"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.courseFindMany).not.toHaveBeenCalled();
  });

  it("logs database failures without leaking internals", async () => {
    mocks.courseFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("https://example.com/api/courses?slug=50hr&locale=en"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "courses.public",
      expect.any(Error),
      expect.any(NextRequest),
      { slug: "50hr", locale: "en" },
    );
  });
});
