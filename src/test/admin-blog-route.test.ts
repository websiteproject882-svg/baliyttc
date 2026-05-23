import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/blog/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  blogFindMany: vi.fn(),
  blogFindUnique: vi.fn(),
  blogCreate: vi.fn(),
  blogUpdate: vi.fn(),
  blogDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    blogPost: {
      findMany: mocks.blogFindMany,
      findUnique: mocks.blogFindUnique,
      create: mocks.blogCreate,
      update: mocks.blogUpdate,
      delete: mocks.blogDelete,
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

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: ["blog.view", "blog.create", "blog.edit"],
  authType: "admin",
};

const post = {
  id: "post_1",
  title: "Yoga Teacher Training in Bali",
  slug: "yoga-teacher-training-bali",
  excerpt: "A practical guide to choosing a yoga teacher training in Bali.",
  content: "Long-form content about the complete teacher training experience in Bali.",
  featuredImage: "https://example.com/blog.jpg",
  category: "Training",
  tags: ["ytt", "bali"],
  author: "Bali YTTC",
  locale: "en",
  status: "PUBLISHED",
  publishedAt: new Date("2026-03-01T00:00:00.000Z"),
  scheduledAt: null,
  readTime: 6,
  metaTitle: "Yoga Teacher Training Bali",
  metaDescription: "Choose the right yoga teacher training in Bali.",
  focusKeyword: "yoga teacher training bali",
};

function request(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
  url = "https://example.com/api/admin/blog",
) {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_blog",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/blog", {
    method,
    headers: {
      "x-request-id": "req_admin_blog",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Yoga Teacher Training in Bali",
    slug: "yoga-teacher-training-bali",
    excerpt: "A practical guide to choosing a yoga teacher training in Bali.",
    content: "Long-form content about the complete teacher training experience in Bali.",
    featuredImage: "https://example.com/blog.jpg",
    category: "Training",
    tags: ["ytt", "bali"],
    author: "Bali YTTC",
    locale: "en",
    status: "PUBLISHED",
    publishedAt: "2026-03-01T00:00:00.000Z",
    scheduledAt: null,
    readTime: "6",
    seoTitle: "Yoga Teacher Training Bali",
    seoDescription: "Choose the right yoga teacher training in Bali.",
    focusKeyword: "yoga teacher training bali",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.blogFindMany.mockResolvedValue([post]);
  mocks.blogFindUnique.mockResolvedValue(null);
  mocks.blogCreate.mockResolvedValue(post);
  mocks.blogUpdate.mockResolvedValue({ ...post, title: "Updated Blog Post" });
  mocks.blogDelete.mockResolvedValue(post);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin blog route", () => {
  it("lists blog posts with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_blog");
    expect(body.posts).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("blog.view");
    expect(mocks.blogFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("creates localized blog posts and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("blog.create");
    expect(mocks.blogFindUnique).toHaveBeenCalledWith({
      where: { slug_locale: { slug: "yoga-teacher-training-bali", locale: "en" } },
    });
    expect(mocks.blogCreate).toHaveBeenCalledWith({
      data: {
        title: "Yoga Teacher Training in Bali",
        slug: "yoga-teacher-training-bali",
        excerpt: "A practical guide to choosing a yoga teacher training in Bali.",
        content: "Long-form content about the complete teacher training experience in Bali.",
        featuredImage: "https://example.com/blog.jpg",
        category: "Training",
        tags: ["ytt", "bali"],
        author: "Bali YTTC",
        locale: "en",
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
        scheduledAt: null,
        readTime: 6,
        metaTitle: "Yoga Teacher Training Bali",
        metaDescription: "Choose the right yoga teacher training in Bali.",
        focusKeyword: "yoga teacher training bali",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "blog.created",
        entity: "blogPost",
        entityId: "post_1",
      }),
    );
  });

  it("rejects duplicate slugs within the same locale", async () => {
    mocks.blogFindUnique.mockResolvedValue(post);

    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("A post with this slug already exists for this language");
    expect(mocks.blogCreate).not.toHaveBeenCalled();
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ slug: "Bad Slug!", content: "" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogCreate).not.toHaveBeenCalled();
  });

  it("rejects oversized blog payloads before slug lookup", async () => {
    const response = await POST(request("POST", payload({ title: "x".repeat(181) })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogFindUnique).not.toHaveBeenCalled();
    expect(mocks.blogCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed blog create JSON before slug lookup", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_blog");
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogFindUnique).not.toHaveBeenCalled();
    expect(mocks.blogCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates existing blog posts and writes an audit log", async () => {
    mocks.blogFindUnique.mockResolvedValueOnce(post).mockResolvedValueOnce(null);

    const response = await PATCH(request("PATCH", payload({ id: "post_1", title: "Updated Blog Post" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.post.title).toBe("Updated Blog Post");
    expect(mocks.requirePermission).toHaveBeenCalledWith("blog.edit");
    expect(mocks.blogUpdate).toHaveBeenCalledWith({
      where: { id: "post_1" },
      data: expect.objectContaining({
        title: "Updated Blog Post",
        slug: "yoga-teacher-training-bali",
        readTime: 6,
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "blog.updated",
        oldValue: post,
      }),
    );
  });

  it("returns 404 when updating a missing post", async () => {
    mocks.blogFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Post not found");
    expect(mocks.blogUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed blog update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_blog");
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogFindUnique).not.toHaveBeenCalled();
    expect(mocks.blogUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("rejects oversized blog update ids before lookup", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "x".repeat(121) })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogFindUnique).not.toHaveBeenCalled();
    expect(mocks.blogUpdate).not.toHaveBeenCalled();
  });

  it("blocks updates that collide with another slug and locale", async () => {
    mocks.blogFindUnique
      .mockResolvedValueOnce({ ...post, slug: "old-slug" })
      .mockResolvedValueOnce({ ...post, id: "post_2" });

    const response = await PATCH(request("PATCH", payload({ id: "post_1" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("A post with this slug already exists for this language");
    expect(mocks.blogUpdate).not.toHaveBeenCalled();
  });

  it("deletes blog posts and writes an audit log", async () => {
    mocks.blogFindUnique.mockResolvedValue(post);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/blog?id=post_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.blogDelete).toHaveBeenCalledWith({ where: { id: "post_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "blog.deleted",
        entityId: "post_1",
        oldValue: post,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Post id is required");
  });

  it("rejects oversized blog delete ids before lookup", async () => {
    const response = await DELETE(request("DELETE", undefined, `https://example.com/api/admin/blog?id=${"x".repeat(121)}`));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogFindUnique).not.toHaveBeenCalled();
    expect(mocks.blogDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.blogFindUnique.mockResolvedValue(post);
    mocks.blogDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/blog?id=post_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete post");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.blog.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
