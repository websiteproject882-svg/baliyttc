import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST } from "../app/api/admin/coupons/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  couponFindMany: vi.fn(),
  couponFindUnique: vi.fn(),
  couponCreate: vi.fn(),
  couponUpdate: vi.fn(),
  couponDelete: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    coupon: {
      findMany: mocks.couponFindMany,
      findUnique: mocks.couponFindUnique,
      create: mocks.couponCreate,
      update: mocks.couponUpdate,
      delete: mocks.couponDelete,
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
  permissions: ["coupons.view", "coupons.create", "coupons.edit"],
  authType: "admin",
};

const coupon = {
  id: "coupon_1",
  code: "EARLYBIRD",
  discountType: "PERCENTAGE",
  discount: 10,
  minAmount: 500,
  maxDiscount: 200,
  usageLimit: 20,
  usedCount: 2,
  expiresAt: new Date("2026-02-01T00:00:00.000Z"),
  isActive: true,
};

function request(method: "GET" | "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>, url = "https://example.com/api/admin/coupons") {
  return new NextRequest(url, {
    method,
    headers: {
      "x-request-id": "req_admin_coupons",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function rawRequest(method: "POST" | "PATCH", body: string) {
  return new NextRequest("https://example.com/api/admin/coupons", {
    method,
    headers: {
      "x-request-id": "req_admin_coupons",
      origin: "https://example.com",
      host: "example.com",
    },
    body,
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    code: " earlybird ",
    discountType: "PERCENTAGE",
    discount: 10,
    minAmount: 500,
    maxDiscount: 200,
    usageLimit: 20,
    expiresAt: "2026-02-01",
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.couponFindMany.mockResolvedValue([coupon]);
  mocks.couponFindUnique.mockResolvedValue(coupon);
  mocks.couponCreate.mockResolvedValue(coupon);
  mocks.couponUpdate.mockResolvedValue({ ...coupon, discount: 15 });
  mocks.couponDelete.mockResolvedValue(coupon);
  mocks.writeAuditLog.mockResolvedValue(undefined);
});

describe("admin coupons route", () => {
  it("lists coupons with request id", async () => {
    const response = await GET(request("GET"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_coupons");
    expect(body.coupons).toHaveLength(1);
    expect(mocks.requirePermission).toHaveBeenCalledWith("coupons.view");
    expect(mocks.couponFindMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  });

  it("creates coupons, normalizes codes, and writes an audit log", async () => {
    const response = await POST(request("POST", payload()));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.requirePermission).toHaveBeenCalledWith("coupons.create");
    expect(mocks.couponCreate).toHaveBeenCalledWith({
      data: {
        code: "EARLYBIRD",
        discountType: "PERCENTAGE",
        discount: 10,
        minAmount: 500,
        maxDiscount: 200,
        usageLimit: 20,
        expiresAt: expect.any(Date),
        isActive: true,
      },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "coupon.created",
        entity: "coupon",
        entityId: "coupon_1",
      }),
    );
  });

  it("stores nullable optional fields as nulls", async () => {
    await POST(request("POST", payload({ minAmount: undefined, maxDiscount: undefined, usageLimit: undefined, expiresAt: "" })));

    expect(mocks.couponCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        minAmount: null,
        maxDiscount: null,
        usageLimit: null,
        expiresAt: null,
      }),
    });
  });

  it("validates percentage discounts above 100", async () => {
    const response = await POST(request("POST", payload({ discount: 101 })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.couponCreate).not.toHaveBeenCalled();
  });

  it("validates invalid expiry dates", async () => {
    const response = await POST(request("POST", payload({ expiresAt: "not-a-date" })));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.couponCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed coupon create JSON before saving", async () => {
    const response = await POST(rawRequest("POST", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_coupons");
    expect(body.error).toBe("Validation failed");
    expect(mocks.couponCreate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("updates existing coupons and writes an audit log", async () => {
    const response = await PATCH(request("PATCH", payload({ id: "coupon_1", discount: 15 })));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body.coupon.discount).toBe(15);
    expect(mocks.requirePermission).toHaveBeenCalledWith("coupons.edit");
    expect(mocks.couponUpdate).toHaveBeenCalledWith({
      where: { id: "coupon_1" },
      data: expect.objectContaining({
        code: "EARLYBIRD",
        discount: 15,
        expiresAt: expect.any(Date),
      }),
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "coupon.updated",
        oldValue: coupon,
      }),
    );
  });

  it("returns 404 when updating a missing coupon", async () => {
    mocks.couponFindUnique.mockResolvedValue(null);

    const response = await PATCH(request("PATCH", payload({ id: "missing" })));
    const body = await response?.json();

    expect(response?.status).toBe(404);
    expect(body.error).toBe("Coupon not found");
    expect(mocks.couponUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed coupon update JSON before lookup", async () => {
    const response = await PATCH(rawRequest("PATCH", "{not-valid-json"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(response?.headers.get("X-Request-Id")).toBe("req_admin_coupons");
    expect(body.error).toBe("Validation failed");
    expect(mocks.couponFindUnique).not.toHaveBeenCalled();
    expect(mocks.couponUpdate).not.toHaveBeenCalled();
    expect(mocks.logApiError).not.toHaveBeenCalled();
  });

  it("deletes coupons and writes an audit log", async () => {
    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/coupons?id=coupon_1"));
    const body = await response?.json();

    expect(response?.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocks.couponDelete).toHaveBeenCalledWith({ where: { id: "coupon_1" } });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "coupon.deleted",
        entityId: "coupon_1",
        oldValue: coupon,
      }),
    );
  });

  it("validates delete id", async () => {
    const response = await DELETE(request("DELETE"));
    const body = await response?.json();

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Coupon id is required");
  });

  it("logs delete failures without leaking internals", async () => {
    mocks.couponDelete.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request("DELETE", undefined, "https://example.com/api/admin/coupons?id=coupon_1"));
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(body.error).toBe("Failed to delete coupon");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.coupons.delete",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
