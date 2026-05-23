import { describe, expect, it } from "vitest";
import { canAccessAdminNavItem } from "../lib/admin-navigation";

describe("admin navigation access", () => {
  it("shows public admin links without permission requirements", () => {
    expect(canAccessAdminNavItem("SEO_EDITOR")).toBe(true);
  });

  it("shows links when the role has the required permission", () => {
    expect(canAccessAdminNavItem("SEO_EDITOR", { permission: "blog.view" })).toBe(true);
    expect(canAccessAdminNavItem("FINANCE_MANAGER", { permission: "analytics.revenue" })).toBe(true);
  });

  it("hides links when the role does not have the required permission", () => {
    expect(canAccessAdminNavItem("SEO_EDITOR", { permission: "analytics.revenue" })).toBe(false);
    expect(canAccessAdminNavItem("FINANCE_MANAGER", { permission: "templates.view" })).toBe(false);
  });

  it("supports role-only links for super-admin tools", () => {
    expect(canAccessAdminNavItem("SUPER_ADMIN", { roles: ["SUPER_ADMIN"] })).toBe(true);
    expect(canAccessAdminNavItem("STUDENT_MANAGER", { roles: ["SUPER_ADMIN"] })).toBe(false);
  });

  it("prefers stored permissions when provided", () => {
    expect(canAccessAdminNavItem("SEO_EDITOR", { permission: "blog.edit" }, ["blog.view"])).toBe(false);
    expect(canAccessAdminNavItem("SEO_EDITOR", { permission: "blog.edit" }, ["blog.view", "blog.edit"])).toBe(true);
  });
});
