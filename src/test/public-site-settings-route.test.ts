import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/site-settings/route";
import { defaultSiteSettings } from "../lib/site-settings";

const mocks = vi.hoisted(() => ({
  getSiteSettings: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    siteSetting: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/site-settings", async () => {
  const actual = await vi.importActual<typeof import("../lib/site-settings")>("../lib/site-settings");
  return {
    ...actual,
    getSiteSettings: mocks.getSiteSettings,
  };
});

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("../lib/security")>("../lib/security");
  return {
    ...actual,
    logApiError: mocks.logApiError,
  };
});

function request() {
  return new NextRequest("https://example.com/api/site-settings", {
    method: "GET",
    headers: {
      "x-request-id": "req_public_site_settings",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSiteSettings.mockResolvedValue(defaultSiteSettings);
});

describe("public site settings route", () => {
  it("returns only public settings sections", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req_public_site_settings");
    expect(body).toEqual({
      settings: {
        general: defaultSiteSettings.general,
        reviews: defaultSiteSettings.reviews,
        assets: defaultSiteSettings.assets,
      },
    });
    expect(body.settings.payments).toBeUndefined();
    expect(body.settings.notifications).toBeUndefined();
  });

  it("logs failures without leaking internals", async () => {
    mocks.getSiteSettings.mockRejectedValue(new Error("database down"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch site settings");
    expect(mocks.logApiError).toHaveBeenCalledWith(
      "siteSettings.public",
      expect.any(Error),
      expect.any(NextRequest),
    );
  });
});
