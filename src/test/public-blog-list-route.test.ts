import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/blog/route";

const mocks = vi.hoisted(() => ({
  blogPostFindMany: vi.fn(),
  blogPostCount: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    blogPost: {
      findMany: mocks.blogPostFindMany,
      count: mocks.blogPostCount,
    },
  },
}));

vi.mock("@/i18n/routing", () => ({
  defaultLocale: "en",
}));

vi.mock("@/lib/localized-content", () => ({
  normalizeLocale: (locale: string | null) => locale || "en",
}));

vi.mock("@/data/blog", () => ({
  STATIC_BLOG_POSTS: [
    { id: "static_1", slug: "one", title: "One", category: "Training", publishedAt: "2026-01-01T00:00:00.000Z" },
    { id: "static_2", slug: "two", title: "Two", category: "Practice", publishedAt: "2026-01-02T00:00:00.000Z" },
  ],
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request(url = "https://example.com/api/blog?locale=en&limit=10&page=1") {
  return new NextRequest(url, { headers: { "x-request-id": "req_blog_list" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.blogPostFindMany.mockResolvedValue([]);
  mocks.blogPostCount.mockResolvedValue(0);
});

describe("public blog list route", () => {
  it("filters list queries to published posts whose publish date is public", async () => {
    const response = await GET(request("https://example.com/api/blog?locale=en&category=Training&limit=6&page=1"));

    expect(response.status).toBe(200);
    expect(mocks.blogPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PUBLISHED",
          locale: "en",
          OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }],
          category: "Training",
        },
        skip: 0,
        take: 6,
      }),
    );
    expect(mocks.blogPostCount).toHaveBeenCalledWith({
      where: {
        status: "PUBLISHED",
        locale: "en",
        OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }],
        category: "Training",
      },
    });
  });

  it("uses the same public-only filter for default-locale fallback", async () => {
    mocks.blogPostFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "post_en",
          title: "English guide",
          slug: "english-guide",
          excerpt: "Guide",
          featuredImage: null,
          category: "Training",
          tags: [],
          author: "Bali YTTC",
          publishedAt: null,
          readTime: 5,
        },
      ]);
    mocks.blogPostCount.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    const response = await GET(request("https://example.com/api/blog?locale=fr&category=Training&limit=6&page=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(2);
    expect(body.posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "post_en" }),
        expect.objectContaining({ id: "static_1" }),
      ]),
    );
    expect(mocks.blogPostFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          status: "PUBLISHED",
          locale: "en",
          OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }],
          category: "Training",
        },
      }),
    );
  });

  it("clamps invalid pagination input for public list queries", async () => {
    const response = await GET(request("https://example.com/api/blog?locale=en&limit=500&page=-2"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_blog_list");
    expect(body.pagination).toEqual(expect.objectContaining({ page: 1, limit: 30 }));
    expect(mocks.blogPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 30,
      }),
    );
  });

  it("uses clamped pagination and filtered totals for static fallback", async () => {
    mocks.blogPostFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("https://example.com/api/blog?category=Training&limit=500&page=-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.posts).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 30,
      total: 1,
      totalPages: 1,
    });
    expect(mocks.logApiError).toHaveBeenCalledWith("blog.list", expect.any(Error), expect.any(NextRequest));
  });
});
