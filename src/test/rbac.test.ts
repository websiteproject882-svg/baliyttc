import { describe, expect, it } from "vitest";
import { getRoleHomePath, hasPermission, isAdminPanelRole, isStaffRole } from "../lib/rbac";

describe("rbac helpers", () => {
  it("recognizes admin panel roles", () => {
    expect(isAdminPanelRole("SUPER_ADMIN")).toBe(true);
    expect(isAdminPanelRole("FINANCE_MANAGER")).toBe(true);
    expect(isAdminPanelRole("TEACHER")).toBe(false);
  });

  it("recognizes staff roles", () => {
    expect(isStaffRole("TEACHER")).toBe(true);
    expect(isStaffRole("STUDENT")).toBe(false);
  });

  it("maps role home paths correctly", () => {
    expect(getRoleHomePath("TEACHER")).toBe("/app/teacher/dashboard");
    expect(getRoleHomePath("SEO_EDITOR")).toBe("/admin/overview");
    expect(getRoleHomePath("STUDENT")).toBe("/app/dashboard");
  });

  it("checks permissions", () => {
    expect(hasPermission("SUPER_ADMIN", "payments.refund")).toBe(true);
    expect(hasPermission("FINANCE_MANAGER", "payments.refund")).toBe(true);
    expect(hasPermission("SEO_EDITOR", "social_proof.edit")).toBe(true);
    expect(hasPermission("SEO_EDITOR", "templates.edit")).toBe(true);
    expect(hasPermission("FINANCE_MANAGER", "analytics.revenue")).toBe(true);
    expect(hasPermission("SEO_EDITOR", "analytics.partial")).toBe(true);
    expect(hasPermission("SEO_EDITOR", "analytics.revenue")).toBe(false);
    expect(hasPermission("STUDENT_MANAGER", "schedule.view")).toBe(true);
    expect(hasPermission("STUDENT_MANAGER", "schedule.edit")).toBe(false);
    expect(hasPermission("COURSE_MANAGER", "schedule.edit")).toBe(true);
    expect(hasPermission("COURSE_MANAGER", "students.view")).toBe(true);
    expect(hasPermission("STUDENT_MANAGER", "social_proof.view")).toBe(true);
    expect(hasPermission("STUDENT_MANAGER", "social_proof.edit")).toBe(false);
    expect(hasPermission("FINANCE_MANAGER", "templates.edit")).toBe(false);
    expect(hasPermission("TEACHER", "payments.refund")).toBe(false);
  });
});
