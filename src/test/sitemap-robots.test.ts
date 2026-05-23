import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  courseFindMany: vi.fn(),
  blogPostFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    course: {
      findMany: mocks.courseFindMany,
    },
    blogPost: {
      findMany: mocks.blogPostFindMany,
    },
  },
}));

vi.mock("@/i18n/routing", () => ({
  locales: ["en", "id"],
}));

describe("sitemap and robots metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyttc.test";
    mocks.courseFindMany.mockResolvedValue([{ slug: "200hr" }, { slug: "200hr" }, { slug: "300hr" }]);
    mocks.blogPostFindMany.mockResolvedValue([{ slug: "first-post" }, { slug: "first-post" }]);
  });

  it("includes all public marketing routes for every enabled locale", async () => {
    const { default: sitemap } = await import("../app/sitemap");

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://baliyttc.test/en");
    expect(urls).toContain("https://baliyttc.test/en/retreats");
    expect(urls).toContain("https://baliyttc.test/en/workshops");
    expect(urls).toContain("https://baliyttc.test/en/videos");
    expect(urls).toContain("https://baliyttc.test/en/activities");
    expect(urls).toContain("https://baliyttc.test/en/testimonials");
    expect(urls).toContain("https://baliyttc.test/id/retreats");
    expect(urls.filter((url) => url.endsWith("/en/courses/200hr"))).toHaveLength(1);
    expect(urls.filter((url) => url.endsWith("/id/blog/first-post"))).toHaveLength(1);
    expect(mocks.courseFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { slug: true },
    });
    expect(mocks.blogPostFindMany).toHaveBeenCalledWith({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
  });

  it("keeps sitemap resilient when the database is unavailable", async () => {
    mocks.courseFindMany.mockRejectedValue(new Error("database down"));
    const { default: sitemap } = await import("../app/sitemap");

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://baliyttc.test/en/courses/100hr");
    expect(urls).toContain("https://baliyttc.test/en/courses/200hr");
    expect(urls).toContain("https://baliyttc.test/en/courses/300hr");
  });

  it("disallows private and API routes in robots metadata", async () => {
    const { default: robots } = await import("../app/robots");

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/*/admin", "/app", "/*/app", "/staff", "/*/staff", "/api"],
      },
      sitemap: "https://baliyttc.test/sitemap.xml",
    });
  });
});
