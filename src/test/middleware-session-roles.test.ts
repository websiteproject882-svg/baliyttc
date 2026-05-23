import { describe, expect, it } from "vitest";
import { isSessionAllowedForAuthType } from "../lib/session-access";
import { getProtectedRouteRequirement } from "../lib/route-protection";

describe("middleware session role boundaries", () => {
  it("allows only student roles for student app sessions", () => {
    expect(isSessionAllowedForAuthType({ authType: "student", role: "STUDENT" }, "student")).toBe(true);

    expect(isSessionAllowedForAuthType({ authType: "student", role: "TEACHER" }, "student")).toBe(false);
    expect(isSessionAllowedForAuthType({ authType: "student", role: "SUPER_ADMIN" }, "student")).toBe(false);
    expect(isSessionAllowedForAuthType({ authType: "student", role: "ADMIN" }, "student")).toBe(false);
  });

  it("allows only staff portal roles for staff sessions", () => {
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "TEACHER" }, "staff")).toBe(true);
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "SEO_EDITOR" }, "staff")).toBe(true);
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "FINANCE_MANAGER" }, "staff")).toBe(true);
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "COURSE_MANAGER" }, "staff")).toBe(true);

    expect(isSessionAllowedForAuthType({ authType: "staff", role: "STUDENT" }, "staff")).toBe(false);
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "SUPER_ADMIN" }, "staff")).toBe(false);
  });

  it("rejects auth type mismatches before protected pages render", () => {
    expect(isSessionAllowedForAuthType({ authType: "student", role: "STUDENT" }, "staff")).toBe(false);
    expect(isSessionAllowedForAuthType({ authType: "staff", role: "TEACHER" }, "student")).toBe(false);
    expect(isSessionAllowedForAuthType(null, "student")).toBe(false);
  });

  it("protects teacher app pages with staff sessions instead of student sessions", () => {
    expect(getProtectedRouteRequirement("/app/teacher/dashboard")).toBe("staff");
    expect(getProtectedRouteRequirement("/app/teacher/students")).toBe("staff");
    expect(getProtectedRouteRequirement("/app/dashboard")).toBe("student");
    expect(getProtectedRouteRequirement("/staff/dashboard")).toBe("staff");
    expect(getProtectedRouteRequirement("/admin/overview")).toBe("admin-panel");
    expect(getProtectedRouteRequirement("/login")).toBeNull();
  });
});
