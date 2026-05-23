import { describe, expect, it } from "vitest";
import { canManageStudentCertificates } from "../lib/certificate-access";

describe("certificate access", () => {
  it("allows legacy admin roles", () => {
    expect(canManageStudentCertificates({ role: "SUPER_ADMIN" })).toBe(true);
    expect(canManageStudentCertificates({ role: "STUDENT_MANAGER" })).toBe(true);
  });

  it("uses stored permissions for staff users", () => {
    expect(
      canManageStudentCertificates({
        role: "STUDENT_MANAGER",
        staffId: "staff_1",
        permissions: ["students.view"],
      }),
    ).toBe(false);
    expect(
      canManageStudentCertificates({
        role: "STUDENT_MANAGER",
        staffId: "staff_1",
        permissions: ["certificates.view"],
      }),
    ).toBe(true);
  });

  it("allows wildcard staff permissions", () => {
    expect(canManageStudentCertificates({ role: "SUPER_ADMIN", staffId: "staff_1", permissions: ["*"] })).toBe(true);
  });
});
