import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/blog/[slug]/route";

const mocks = vi.hoisted(() => ({
  blogPostFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    blogPost: {
      findFirst: mocks.blogPostFindFirst,
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
  findStaticBlogPost: vi.fn(() => null),
}));

function request(locale = "en") {
  return new NextRequest(`https://example.com/api/blog/yoga-guide?locale=${locale}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public blog post route", () => {
  it("returns only published posts that are already public", async () => {
    const post = {
      id: "post_1",
      slug: "yoga-guide",
      locale: "en",
      status: "PUBLISHED",
      title: "Yoga Guide",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    mocks.blogPostFindFirst.mockResolvedValue(post);

    const response = await GET(request(), { params: { slug: "yoga-guide" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.post).toEqual(expect.objectContaining({ id: "post_1", title: "Yoga Guide" }));
    expect(mocks.blogPostFindFirst).toHaveBeenCalledWith({
      where: {
        slug_locale: { slug: "yoga-guide", locale: "en" },
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }],
      },
    });
  });

  it("does not expose drafts or scheduled posts by direct slug", async () => {
    mocks.blogPostFindFirst.mockResolvedValue(null);

    const response = await GET(request(), { params: { slug: "draft-post" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Post not found");
  });

  it("falls back to the default locale using the same public-only filter", async () => {
    const post = {
      id: "post_en",
      slug: "yoga-guide",
      locale: "en",
      status: "PUBLISHED",
      title: "English Yoga Guide",
      publishedAt: null,
    };
    mocks.blogPostFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(post);

    const response = await GET(request("fr"), { params: { slug: "yoga-guide" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.post).toEqual(expect.objectContaining({ id: "post_en" }));
    expect(mocks.blogPostFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        slug_locale: { slug: "yoga-guide", locale: "en" },
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }],
      },
    });
  });
});
