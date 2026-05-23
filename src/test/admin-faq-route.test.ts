import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/faq/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  faqFindMany: vi.fn(),
  faqFindFirst: vi.fn(),
  faqFindUnique: vi.fn(),
  faqCreate: vi.fn(),
  faqUpdate: vi.fn(),
  faqDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    fAQ: {
      findMany: mocks.faqFindMany,
      findFirst: mocks.faqFindFirst,
      findUnique: mocks.faqFindUnique,
      create: mocks.faqCreate,
      update: mocks.faqUpdate,
      delete: mocks.faqDelete,
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
  permissions: ["faq.view", "faq.edit"],
  authType: "admin",
};

const faq = {
  id: "faq_1",
  question: "What is included?",
  answer: "Training, accommodation, course materials, and support are included.",
  category: "Course",
  keywords: ["training", "accommodation"],
  locale: "en",
  isActive: true,
  order: 3,
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/faq") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_faq",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    question: "What is included?",
    answer: "Training, accommodation, course materials, and support are included.",
    category: "Course",
    keywords: ["training", "accommodation"],
    locale: "en",
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.faqFindMany.mockResolvedValue([faq]);
  mocks.faqFindFirst.mockResolvedValue({ order: 3 });
  mocks.faqFindUnique.mockResolvedValue(faq);
  mocks.faqCreate.mockResolvedValue(faq);
  mocks.faqUpdate.mockResolvedValue({ ...faq, question: "Updated question?" });
  mocks.faqDelete.mockResolvedValue(faq);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin FAQ route", () => {
  it("lists FAQs with filters and request id", async () => {
    const response = await GET(request("GET", undefined, "https://example.com/api/admin/faq?locale=en&category=Course"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_faq");
    expect(body.faqs).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("faq.view");
    expect(mocks.faqFindMany).toHaveBeenCalledWith({
      where: {
        locale: "en",
        category: "Course",
      },
      orderBy: [{ locale: "asc" }, { category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });
  });

  it("creates FAQs with next order and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("faq.edit");
    expect(mocks.faqFindFirst).toHaveBeenCalledWith({
      where: { locale: "en", category: "Course" },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    expect(mocks.faqCreate).toHaveBeenCalledWith({
      data: {
        question: "What is included?",
        answer: "Training, accommodation, course materials, and support are included.",
        category: "Course",
        keywords: ["training", "accommodation"],
        locale: "en",
        isActive: true,
        order: 4,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "faq.created",
        entity: "faq",
        entityId: "faq_1",
      }),
    );
  });

  it("starts order at zero for a new FAQ group", async () => {
    mocks.faqFindFirst.mockResolvedValue(null);

    await POST(request("POST", payload({ locale: "id", category: "Visa" })));

    expect(mocks.faqCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        locale: "id",
        category: "Visa",
        order: 0,
      }),
    });
  });

  it("validates create payloads", async () => {
    const response = await POST(request("POST", payload({ answer: "" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.faqCreate).not.toHaveBeenCalled();
  });

  it("updates existing FAQs and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "faq_1", question: "Updated question?" })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.faq.question).toBe("Updated question?");
    expect(mocks.faqUpdate).toHaveBeenCalledWith({
      where: { id: "faq_1" },
      data: {
        question: "Updated question?",
        answer: "Training, accommodation, course materials, and support are included.",
        category: "Course",
        keywords: ["training", "accommodation"],
        locale: "en",
        isActive: true,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "faq.updated",
        oldValue: faq,
      }),
    );
  });

  it("returns 404 when updating a missing FAQ", async () => {
    mocks.faqFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("FAQ not found");
    expect(mocks.faqUpdate).not.toHaveBeenCalled();
  });

  it("deletes FAQs and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/faq?id=faq_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.faqDelete).toHaveBeenCalledWith({ where: { id: "faq_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "faq.deleted",
        entityId: "faq_1",
        oldValue: faq,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("FAQ id is required");
  });

  it("returns 404 when deleting a missing FAQ", async () => {
    mocks.faqFindUnique.mockResolvedValue(null);

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/faq?id=missing"));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("FAQ not found");
    expect(mocks.faqDelete).not.toHaveBeenCalled();
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.faqDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/faq?id=faq_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete FAQ");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.faq.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
