import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/faq/route";

const mocks = vi.hoisted(() => ({
  faqFindMany: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    fAQ: {
      findMany: mocks.faqFindMany,
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

const faq = {
  id: "faq_1",
  question: "What should I pack?",
  answer: "Comfortable yoga clothes.",
  category: "general",
};

function request(url = "https://example.com/api/faq") {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "x-request-id": "req_public_faq",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.faqFindMany.mockResolvedValue([faq]);
});

describe("public FAQ route", () => {
  it("lists active localized FAQs for public pages", async () => {
    const response = await GET(request("https://example.com/api/faq?locale=id&limit=8"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_faq");
    expect(body.faqs).toEqual([faq]);
    expect(mocks.faqFindMany).toHaveBeenCalledWith({
      where: {
        locale: "id",
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
      },
    });
  });

  it("clamps public FAQ limit", async () => {
    await GET(request("https://example.com/api/faq?limit=500"));

    expect(mocks.faqFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it("logs failures without leaking internals", async () => {
    mocks.faqFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch FAQs");
    expect(mocks.logApiError).toHaveBeenCalledWith("faq.list", expect.any(Error), expect.any(NextRequest));
  });
});
