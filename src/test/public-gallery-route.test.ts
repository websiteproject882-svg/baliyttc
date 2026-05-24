import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/gallery/route";

const mocks = vi.hoisted(() => ({
  galleryFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    galleryImage: {
      findMany: mocks.galleryFindMany,
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

const image = {
  id: "gallery_1",
  url: "https://example.com/gallery.jpg",
  alt: "Students practicing yoga",
  caption: "Morning practice",
  category: "Practice",
  type: "PROFESSIONAL",
};

function request(url = "https://example.com/api/gallery") {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "x-request-id": "req_public_gallery",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.galleryFindMany.mockResolvedValue([image]);
});

describe("public gallery route", () => {
  it("lists active and approved gallery images for public pages", async () => {
    const response = await GET(request("https://example.com/api/gallery?limit=12"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_gallery");
    expect(body.images).toEqual([image]);
    expect(mocks.galleryFindMany).toHaveBeenCalledWith({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "APPROVED" }],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        url: true,
        alt: true,
        caption: true,
        category: true,
        type: true,
      },
    });
  });

  it("clamps public gallery limit", async () => {
    await GET(request("https://example.com/api/gallery?limit=200"));

    expect(mocks.galleryFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 60 }));
  });

  it("logs failures without leaking internals", async () => {
    mocks.galleryFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch gallery");
    expect(mocks.logApiError).toHaveBeenCalledWith("gallery.list", expect.any(Error), expect.any(NextRequest));
  });
});
