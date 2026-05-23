import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/blog/route";

const mocks = vi.hoisted(() => ({
  blogPostFindMany: vi.fn(),
  blogPostCount: vi.fn(),
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
  STATIC_BLOG_POSTS: [],
}));

function request(url = "https://example.com/api/blog?locale=en&limit=10&page=1") {
  return new NextRequest(url);
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
    expect(body.posts).toHaveLength(1);
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
});
