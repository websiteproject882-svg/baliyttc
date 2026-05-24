import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { dynamic, GET } from "../app/api/blog/[slug]/route";

const mocks = vi.hoisted(() => ({
  blogPostFindFirst: vi.fn(),
  logApiError: vi.fn(),
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

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

function request(locale = "en") {
  return new NextRequest(`https://example.com/api/blog/yoga-guide?locale=${locale}`, {
    headers: { "x-request-id": "req_blog_detail" },
  });
}

function publicPostWhere(locale: string) {
  return {
    slug_locale: { slug: "yoga-guide", locale },
    OR: [
      { status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: expect.any(Date) } }] },
      { status: "SCHEDULED", scheduledAt: { lte: expect.any(Date) } },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public blog post route", () => {
  it("stays dynamic so admin-edited posts are not served from stale route cache", () => {
    expect(dynamic).toBe("force-dynamic");
  });

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
    expect(response.headers.get("X-Request-Id")).toBe("req_blog_detail");
    expect(body.post).toEqual(expect.objectContaining({ id: "post_1", title: "Yoga Guide" }));
    expect(mocks.blogPostFindFirst).toHaveBeenCalledWith({
      where: publicPostWhere("en"),
    });
  });

  it("does not expose drafts or scheduled posts by direct slug", async () => {
    mocks.blogPostFindFirst.mockResolvedValue(null);

    const response = await GET(request(), { params: { slug: "draft-post" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("X-Request-Id")).toBe("req_blog_detail");
    expect(body.error).toBe("Post not found");
  });

  it("rejects invalid slugs before querying", async () => {
    const response = await GET(request(), { params: { slug: "Bad Slug!" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogPostFindFirst).not.toHaveBeenCalled();
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
      where: publicPostWhere("en"),
    });
  });

  it("logs failures without leaking internals", async () => {
    mocks.blogPostFindFirst.mockRejectedValue(new Error("database down"));

    const response = await GET(request(), { params: { slug: "yoga-guide" } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch blog post");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "blog.detail",
      expect.any(Error),
      expect.any(NextRequest),
      { slug: "yoga-guide" },
    );
  });
});
