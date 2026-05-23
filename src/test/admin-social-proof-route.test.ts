import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../app/api/admin/social-proof/route";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireSameOrigin: vi.fn(),
  writeAuditLog: vi.fn(),
  getSocialProofStats: vi.fn(),
  certificateCount: vi.fn(),
  testimonialAggregate: vi.fn(),
  studentFindMany: vi.fn(),
  studentAggregate: vi.fn(),
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requirePermission: mocks.requirePermission,
  requireSameOrigin: mocks.requireSameOrigin,
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    certificate: {
      count: mocks.certificateCount,
    },
    testimonial: {
      aggregate: mocks.testimonialAggregate,
    },
    student: {
      findMany: mocks.studentFindMany,
      aggregate: mocks.studentAggregate,
    },
    siteSetting: {
      findUnique: mocks.siteSettingFindUnique,
      upsert: mocks.siteSettingUpsert,
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

vi.mock("@/lib/social-proof", async () => {
  const { z } = await import("zod");
  return {
    SOCIAL_PROOF_SETTINGS_KEY: "social_proof_overrides",
    socialProofSchema: z.object({
      totalGraduates: z.coerce.number().int().min(0),
      yearsExperience: z.coerce.number().int().min(0),
      averageRating: z.coerce.number().min(0).max(5),
      totalReviews: z.coerce.number().int().min(0),
      countries: z.coerce.number().int().min(0),
      trainingHours: z.coerce.number().int().min(0),
      certifiedTeachers: z.coerce.number().int().min(0),
    }),
    getSocialProofStats: mocks.getSocialProofStats,
  };
});

const admin = {
  id: "admin_1",
  email: "admin@example.com",
  displayName: "Admin One",
  role: "ADMIN",
  permissions: [],
  authType: "admin",
};

const stats = {
  totalGraduates: 250,
  yearsExperience: 12,
  averageRating: 4.9,
  totalReviews: 620,
  countries: 42,
  trainingHours: 18000,
  certifiedTeachers: 250,
};

function request(method: "GET" | "PATCH", body?: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/admin/social-proof", {
    method,
    headers: {
      "x-request-id": "req_admin_social_proof",
      origin: "https://example.com",
      host: "example.com",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSameOrigin.mockReturnValue(null);
  mocks.requirePermission.mockResolvedValue({ user: admin, response: null });
  mocks.certificateCount.mockResolvedValue(250);
  mocks.testimonialAggregate.mockResolvedValue({
    _count: { id: 620 },
    _avg: { rating: 4.86 },
  });
  mocks.studentFindMany.mockResolvedValue([{ nationality: "India" }, { nationality: "Germany" }]);
  mocks.studentAggregate.mockResolvedValue({ _sum: { completedHours: 18000 } });
  mocks.siteSettingFindUnique.mockResolvedValue(null);
  mocks.siteSettingUpsert.mockResolvedValue({ key: "social_proof_overrides", value: stats });
  mocks.writeAuditLog.mockResolvedValue(undefined);
  mocks.getSocialProofStats.mockImplementation(async () => {
    const [totalGraduates, reviewStats, countries, trainingHours, certifiedTeachers] = await Promise.all([
      mocks.certificateCount({ where: { status: "ISSUED" } }),
      mocks.testimonialAggregate({
        where: { status: "APPROVED" },
        _count: { id: true },
        _avg: { rating: true },
      }),
      mocks.studentFindMany({
        where: { nationality: { not: null } },
        select: { nationality: true },
        distinct: ["nationality"],
      }),
      mocks.studentAggregate({
        _sum: { completedHours: true },
      }),
      mocks.certificateCount({ where: { status: "ISSUED" } }),
    ]);
    const computedStats = {
      totalGraduates,
      yearsExperience: 12,
      averageRating: Number((reviewStats._avg.rating || 4.9).toFixed(1)),
      totalReviews: reviewStats._count.id || 600,
      countries: countries.length || 70,
      trainingHours: Number(trainingHours?._sum?.completedHours) || 50000,
      certifiedTeachers,
    };
    const overrideRow = await mocks.siteSettingFindUnique({ where: { key: "social_proof_overrides" } });
    const isValidOverride =
      overrideRow?.value &&
      typeof overrideRow.value.averageRating === "number" &&
      overrideRow.value.averageRating >= 0 &&
      overrideRow.value.averageRating <= 5;
    const displayStats = isValidOverride ? overrideRow.value : stats;
    return {
      stats: {
        ...displayStats,
        averageRating: displayStats.averageRating >= 4 ? displayStats.averageRating : stats.averageRating,
        totalReviews: displayStats.totalReviews >= 10 ? displayStats.totalReviews : stats.totalReviews,
        countries: displayStats.countries >= 5 ? displayStats.countries : stats.countries,
        trainingHours: displayStats.trainingHours >= 1000 ? displayStats.trainingHours : stats.trainingHours,
        certifiedTeachers: displayStats.certifiedTeachers >= 100 ? displayStats.certifiedTeachers : stats.certifiedTeachers,
      },
      computedStats,
    };
  });
});

describe("admin social proof route", () => {
  it("returns fallback display stats with computed stats when no overrides exist", async () => {
    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_admin_social_proof");
    expect(mocks.requirePermission).toHaveBeenCalledWith("social_proof.view");
    expect(body).toEqual({
      stats,
      computedStats: {
        totalGraduates: 250,
        yearsExperience: 12,
        averageRating: 4.9,
        totalReviews: 620,
        countries: 2,
        trainingHours: 18000,
        certifiedTeachers: 250,
      },
    });
    expect(mocks.certificateCount).toHaveBeenCalledTimes(2);
    expect(mocks.siteSettingFindUnique).toHaveBeenCalledWith({ where: { key: "social_proof_overrides" } });
  });

  it("uses valid saved overrides over computed stats", async () => {
    mocks.siteSettingFindUnique.mockResolvedValue({ key: "social_proof_overrides", value: stats });

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual(stats);
    expect(body.computedStats.countries).toBe(2);
  });

  it("falls back to default display stats when saved overrides are invalid", async () => {
    mocks.siteSettingFindUnique.mockResolvedValue({ key: "social_proof_overrides", value: { ...stats, averageRating: 8 } });

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual(stats);
    expect(body.computedStats.countries).toBe(2);
  });

  it("saves stats, coerces numeric strings, and writes an audit log", async () => {
    mocks.siteSettingFindUnique.mockResolvedValue({ key: "social_proof_overrides", value: { ...stats, totalGraduates: 200 } });

    const response = await PATCH(request("PATCH", { ...stats, totalGraduates: "275", averageRating: "4.8" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requirePermission).toHaveBeenCalledWith("social_proof.edit");
    expect(body).toEqual({
      success: true,
      stats: { ...stats, totalGraduates: 275, averageRating: 4.8 },
    });
    expect(mocks.siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: "social_proof_overrides" },
      create: { key: "social_proof_overrides", value: { ...stats, totalGraduates: 275, averageRating: 4.8 } },
      update: { value: { ...stats, totalGraduates: 275, averageRating: 4.8 } },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin_1",
        action: "social_proof.updated",
        entity: "site_settings",
        entityId: "social_proof_overrides",
      }),
    );
  });

  it("rejects invalid stats payloads", async () => {
    const response = await PATCH(request("PATCH", { ...stats, averageRating: 6 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(mocks.siteSettingUpsert).not.toHaveBeenCalled();
  });

  it("logs fetch failures without leaking internals", async () => {
    mocks.certificateCount.mockRejectedValue(new Error("database down"));

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch social proof");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.socialProof.list",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });

  it("logs save failures without leaking internals", async () => {
    mocks.siteSettingUpsert.mockRejectedValue(new Error("database down"));

    const response = await PATCH(request("PATCH", stats));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to update social proof");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "admin.socialProof.update",
      expect.any(Error),
      expect.any(NextRequest),
      { userId: "admin_1" },
    );
  });
});
