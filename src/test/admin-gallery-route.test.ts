import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/gallery/route";

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  galleryFindMany: vi.fn(),
  galleryFindUnique: vi.fn(),
  galleryCreate: vi.fn(),
  galleryUpdate: vi.fn(),
  galleryDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireAdminUser: mocks.requireAdminUser,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    galleryImage: {
      findMany: mocks.galleryFindMany,
      findUnique: mocks.galleryFindUnique,
      create: mocks.galleryCreate,
      update: mocks.galleryUpdate,
      delete: mocks.galleryDelete,
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
  permissions: [],
  authType: "admin",
};

const image = {
  id: "gallery_1",
  url: "https://example.com/gallery.jpg",
  alt: "Students practicing yoga",
  caption: "Morning practice",
  type: "PROFESSIONAL",
  status: "ACTIVE",
  order: 2,
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/gallery") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_gallery",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://example.com/gallery.jpg",
    alt: "Students practicing yoga",
    caption: "Morning practice",
    type: "PROFESSIONAL",
    status: "ACTIVE",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requireAdminUser.mockResolvedValue({ user: admin, response: null });
  mocks.galleryFindMany.mockResolvedValue([image]);
  mocks.galleryFindUnique.mockResolvedValue(image);
  mocks.galleryCreate.mockResolvedValue(image);
  mocks.galleryUpdate.mockResolvedValue({ ...image, order: 3 });
  mocks.galleryDelete.mockResolvedValue(image);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin gallery route", () => {
  it("lists gallery images with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_gallery");
    expect(body.images).toHaveLength(1);
    expect(mocks.requireAdminUser).toHaveBeenCalled();
    expect(mocks.galleryFindMany).toHaveBeenCalledWith({
      orderBy: { order: "asc" },
    });
  });

  it("creates gallery images and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.image).toEqual(expect.objectContaining({ id: "gallery_1" }));
    expect(mocks.galleryCreate).toHaveBeenCalledWith({
      data: {
        url: "https://example.com/gallery.jpg",
        alt: "Students practicing yoga",
        caption: "Morning practice",
        type: "PROFESSIONAL",
        status: "ACTIVE",
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "gallery.added",
        entity: "galleryImage",
        entityId: "gallery_1",
      }),
    );
  });

  it("falls back alt text to the URL when alt is empty", async () => {
    await POST(request("POST", payload({ alt: "" })));

    expect(mocks.galleryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        alt: "https://example.com/gallery.jpg",
      }),
    });
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ url: "not-a-url" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.galleryCreate).not.toHaveBeenCalled();
  });

  it("updates gallery images, coerces order, and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", { id: "gallery_1", order: "3", caption: null }));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.image.order).toBe(3);
    expect(mocks.galleryFindUnique).toHaveBeenCalledWith({ where: { id: "gallery_1" } });
    expect(mocks.galleryUpdate).toHaveBeenCalledWith({
      where: { id: "gallery_1" },
      data: {
        caption: null,
        order: 3,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "gallery.updated",
        entityId: "gallery_1",
      }),
    );
  });

  it("returns 404 when updating a missing gallery image", async () => {
    mocks.galleryFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", { id: "missing", order: 1 }));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Gallery image not found");
    expect(mocks.galleryUpdate).not.toHaveBeenCalled();
  });

  it("deletes gallery images and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/gallery?id=gallery_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.galleryDelete).toHaveBeenCalledWith({ where: { id: "gallery_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "gallery.deleted",
        entityId: "gallery_1",
        oldValue: image,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Gallery image id is required");
  });

  it("returns 404 when deleting a missing gallery image", async () => {
    mocks.galleryFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/gallery?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Gallery image not found");
    expect(mocks.galleryDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.galleryDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/gallery?id=gallery_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete gallery image");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.gallery.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
