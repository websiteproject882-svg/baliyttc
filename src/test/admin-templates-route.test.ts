import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "../app/api/admin/templates/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  blogFindMany: vi.fn(),
  blogUpsert: vi.fn(),
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
      upsert: mocks.blogUpsert,
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
  permissions: ["admin"],
  authType: "admin",
};

const dbTemplate = {
  id: "template_1",
  title: "Enrollment Confirmation",
  slug: "enrollment",
  content: "Hi {{studentName}}, your course {{courseName}} is confirmed.",
  metaTitle: "Welcome to Bali YTTC",
  updatedAt: new Date("2026-03-01T00:00:00.000Z"),
};

function request(method: "GET" | "PUT", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/templates", {
    method,
    headers: {
      "x-request-id": "req_admin_templates",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "PUT", body: string) {
  return new NextRequest("https://example.com/api/admin/templates", {
    method,
    headers: {
      "x-request-id": "req_admin_templates",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: "template_1",
    name: "Enrollment Confirmation",
    subject: "Welcome to Bali YTTC",
    content: "Hi {{studentName}}, your course {{courseName}} is confirmed.",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.blogFindMany.mockResolvedValue([dbTemplate]);
  mocks.blogUpsert.mockResolvedValue(dbTemplate);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin templates route", () => {
  it("lists stored templates with variables and request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_templates");
    expect(mocks.requirePermission).toHaveBeenCalledWith("templates.view");
    expect(body.templates).toEqual([
      {
        id: "template_1",
        name: "Enrollment Confirmation",
        type: "enrollment",
        subject: "Welcome to Bali YTTC",
        content: "Hi {{studentName}}, your course {{courseName}} is confirmed.",
        lastUpdated: "2026-03-01T00:00:00.000Z",
        variables: ["studentName", "courseName"],
      },
    ]);
    expect(mocks.blogFindMany).toHaveBeenCalledWith({
      where: { category: "email_template" },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns stable default templates when database has none", async () => {
    mocks.blogFindMany.mockResolvedValue([]);

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.templates).toHaveLength(7);
    expect(body.templates[0]).toEqual({
      id: "enrollment",
      slug: "enrollment",
      name: "Enrollment Confirmation",
      type: "enrollment",
      subject: "Enrollment Confirmation - Bali YTTC",
      content: "",
      lastUpdated: "1970-01-01T00:00:00.000Z",
      variables: [],
    });
  });

  it("updates templates and writes an audit log", async () => {
    const response = await PUT(request("PUT", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("templates.edit");
    expect(body.template.variables).toEqual(["studentName", "courseName"]);
    expect(mocks.blogUpsert).toHaveBeenCalledWith({
      where: { id: "template_1" },
      create: {
        id: "template_1",
        title: "Enrollment Confirmation",
        slug: "enrollment-confirmation",
        content: "Hi {{studentName}}, your course {{courseName}} is confirmed.",
        excerpt: "Welcome to Bali YTTC",
        category: "email_template",
        status: "DRAFT",
        author: "admin@example.com",
        metaTitle: "Welcome to Bali YTTC",
      },
      update: {
        title: "Enrollment Confirmation",
        content: "Hi {{studentName}}, your course {{courseName}} is confirmed.",
        metaTitle: "Welcome to Bali YTTC",
        updatedAt: expect.any(Date),
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "template.updated",
        entity: "blogPost",
        entityId: "template_1",
      }),
    );
  });

  it("validates update payloads", async () => {
    const response = await PUT(request("PUT", payload({ subject: "" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogUpsert).not.toHaveBeenCalled();
  });

  it("rejects oversized template ids before upserting", async () => {
    const response = await PUT(request("PUT", payload({ id: "x".repeat(121) })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogUpsert).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("rejects malformed template update JSON before writes", async () => {
    const response = await PUT(rawRequest("PUT", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_templates");
    expect(body.error).toBe("Validation failed");
    expect(mocks.blogUpsert).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("logs list failures without leaking internals", async () => {
    mocks.blogFindMany.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to fetch templates");
    expect(mocks.logApiError).toHaveBeenCalledWith("admin.templates.list", expect.any(Error), expect.any(NextRequest));
  });

  it("logs update failures without leaking internals", async () => {
    mocks.blogUpsert.mockRejectedValue(new Error("database down"));

    const response = await PUT(request("PUT", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to update template");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.templates.update",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
