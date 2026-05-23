import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/app/resources/[id]/route";

const mocks = vi.hoisted(() => ({
  requireStudentUser: vi.fn(),
  preArrivalResourceFindUnique: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireStudentUser: mocks.requireStudentUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    preArrivalResource: {
      findUnique: mocks.preArrivalResourceFindUnique,
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

const student = {
  id: "student_1",
  userId: "user_1",
  accessLevel: "PRE_ARRIVAL",
  paymentStatus: "DEPOSIT_PAID",
  batchId: "batch_1",
  enrolledCourse: "200 Hour YTTC",
};

function request() {
  return new NextRequest("https://example.com/api/app/resources/resource_1", {
    method: "GET",
    headers: { "x-request-id": "req_student_resources" },
  });
}

function params(id = "resource_1") {
  return { params: { id } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStudentUser.mockResolvedValue({ student, response: null });
  mocks.preArrivalResourceFindUnique.mockResolvedValue({
    id: "resource_1",
    title: "Visa Guide",
    url: "https://example-cdn.com/visa-guide.pdf",
    audience: "PRE_ARRIVAL",
    isActive: true,
  });
});

describe("student resource redirect route", () => {
  it("redirects active resources for the student's access level", async () => {
    const response = await GET(request(), params());

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("https://example-cdn.com/visa-guide.pdf");
    expect(mocks.preArrivalResourceFindUnique).toHaveBeenCalledWith({
      where: { id: "resource_1" },
    });
  });

  it("supports relative internal resource URLs", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "Checklist",
      url: "/downloads/checklist.pdf",
      audience: "PRE_ARRIVAL",
      isActive: true,
    });

    const response = await GET(request(), params());

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("https://example.com/downloads/checklist.pdf");
  });

  it("hides inactive resources", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "Draft",
      url: "https://example.com/draft.pdf",
      audience: "PRE_ARRIVAL",
      isActive: false,
    });

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(response?.headers.get("X-Request-Id")).toBe("req_student_resources");
    expect(body.error).toBe("Resource not found");
  });

  it("hides resources outside the student's access level", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "Full access content",
      url: "https://example.com/full.pdf",
      audience: "FULL",
      isActive: true,
    });

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Resource not found");
  });

  it("rejects unsafe redirect schemes", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "Bad URL",
      url: "javascript:alert(1)",
      audience: "PRE_ARRIVAL",
      isActive: true,
    });

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Resource URL is invalid");
  });

  it("rejects plain http resource URLs", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "Insecure URL",
      url: "http://example-cdn.com/visa-guide.pdf",
      audience: "PRE_ARRIVAL",
      isActive: true,
    });

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Resource URL is invalid");
  });

  it("rejects protocol-relative resource URLs", async () => {
    mocks.preArrivalResourceFindUnique.mockResolvedValue({
      id: "resource_1",
      title: "External redirect",
      url: "//evil.example/phish.pdf",
      audience: "PRE_ARRIVAL",
      isActive: true,
    });

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Resource URL is invalid");
  });

  it("rejects oversized resource ids before lookup", async () => {
    const response = await GET(request(), params("x".repeat(121)));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Invalid resource id");
    expect(mocks.preArrivalResourceFindUnique).not.toHaveBeenCalled();
  });

  it("logs database failures without leaking internals", async () => {
    mocks.preArrivalResourceFindUnique.mockRejectedValue(new Error("database down"));

    const response = await GET(request(), params());
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to open resource");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "app.resources.redirect",
      expect.any(Error),
      expect.any(NextRequest),
      { resourceId: "resource_1", studentId: "student_1" },
    );
  });
});
