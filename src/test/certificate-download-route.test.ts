import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/certificates/[id]/download/route";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  certificateFindUnique: vi.fn(),
  generateCertificatePDF: vi.fn(),
  getSiteSettings: vi.fn(),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    certificate: {
      findUnique: mocks.certificateFindUnique,
    },
  },
}));

vi.mock("@/lib/certificate", () => ({
  generateCertificatePDF: mocks.generateCertificatePDF,
}));

vi.mock("@/lib/site-settings", () => ({
  getSiteSettings: mocks.getSiteSettings,
}));

vi.mock("@/lib/security", () => ({
  jsonWithRequestId: (body: unknown, init: ResponseInit | undefined, request: NextRequest) => {
    const response = Response.json(body, init);
    response.headers.set("X-Request-Id", request.headers.get("x-request-id") || "generated-request-id");
    return response;
  },
  logApiError: mocks.logApiError,
}));

const studentUser = {
  id: "student_user_1",
  email: "student@example.com",
  displayName: "Student One",
  role: "STUDENT",
};

const certificate = {
  id: "certificate_1",
  certificateId: "BALI-200-2026-001",
  course: "200 Hour YTTC",
  issuedAt: new Date("2026-05-23T00:00:00.000Z"),
  student: {
    userId: "student_user_1",
    user: {
      email: "student@example.com",
      displayName: "Student One",
    },
  },
};

function request() {
  return new NextRequest("https://example.com/api/certificates/certificate_1/download", {
    headers: { "x-request-id": "req_certificate_download" },
  });
}

function get(certificateId = "certificate_1") {
  return GET(request(), { params: { id: certificateId } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue(studentUser);
  mocks.certificateFindUnique.mockResolvedValue(certificate);
  mocks.generateCertificatePDF.mockResolvedValue(Buffer.from("%PDF-test"));
  mocks.getSiteSettings.mockResolvedValue({
    general: {
      schoolName: "Bali YTTC",
      address: "Ubud, Bali, Indonesia",
    },
    assets: {
      certificateTemplateUrl: "",
    },
  });
});

describe("certificate download route", () => {
  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await get();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("X-Request-Id")).toBe("req_certificate_download");
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mocks.certificateFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when certificate is missing", async () => {
    mocks.certificateFindUnique.mockResolvedValue(null);

    const response = await get("missing");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Certificate not found" });
    expect(mocks.generateCertificatePDF).not.toHaveBeenCalled();
  });

  it("blocks non-owner students from downloading another student's certificate", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      ...studentUser,
      id: "other_user",
    });

    const response = await get();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.generateCertificatePDF).not.toHaveBeenCalled();
  });

  it("allows the owner to download a generated PDF", async () => {
    const response = await get();
    const body = Buffer.from(await response.arrayBuffer()).toString();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="certificate-BALI-200-2026-001.pdf"',
    );
    expect(body).toBe("%PDF-test");
    expect(mocks.generateCertificatePDF).toHaveBeenCalledWith({
      studentName: "Student One",
      courseName: "200 Hour YTTC",
      courseHours: 200,
      completionDate: new Date("2026-05-23T00:00:00.000Z"),
      certificateId: "BALI-200-2026-001",
      schoolName: "Bali YTTC",
      schoolLocation: "Ubud, Bali, Indonesia",
      instructorName: "Vivek Kalura",
      templateImageUrl: undefined,
    });
  });

  it("passes configured certificate template images to PDF generation", async () => {
    mocks.getSiteSettings.mockResolvedValue({
      general: {
        schoolName: "Client School",
        address: "Client Address",
      },
      assets: {
        certificateTemplateUrl: "https://example.com/certificate-template.png",
      },
    });

    const response = await get();

    expect(response.status).toBe(200);
    expect(mocks.generateCertificatePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolName: "Client School",
        schoolLocation: "Client Address",
        templateImageUrl: "https://example.com/certificate-template.png",
      }),
    );
  });

  it("allows privileged admin roles to download certificates", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      displayName: "Admin",
      role: "STUDENT_MANAGER",
    });

    const response = await get();

    expect(response.status).toBe(200);
    expect(mocks.generateCertificatePDF).toHaveBeenCalled();
  });
});
