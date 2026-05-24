import { describe, expect, it } from "vitest";
import { filterStaffNavigationItems } from "../lib/staff-navigation";

const items = [
  { name: "Dashboard", permission: null, adminOnly: false },
  { name: "Schedule", permission: "schedule.view", adminOnly: false },
  { name: "My Batch", permission: "students.view_own_batch", adminOnly: false },
  { name: "Blog", permission: "blog.view", adminOnly: true },
  { name: "Gallery", permission: "gallery.view", adminOnly: true },
  { name: "Admin Home", permission: null, adminOnly: true },
];

describe("staff navigation access", () => {
  it("hides admin-only links from teachers", () => {
    const visibleItems = filterStaffNavigationItems(items, "TEACHER").map((item) => item.name);

    expect(visibleItems).toEqual(["Dashboard", "Schedule", "My Batch"]);
    expect(visibleItems).not.toContain("Admin Home");
    expect(visibleItems).not.toContain("Blog");
    expect(visibleItems).not.toContain("Gallery");
  });

  it("shows admin panel links only when the role can actually enter admin", () => {
    const visibleItems = filterStaffNavigationItems(items, "SEO_EDITOR").map((item) => item.name);

    expect(visibleItems).toEqual(["Dashboard", "Blog", "Gallery", "Admin Home"]);
  });

  it("keeps only permissionless non-admin defaults for missing roles", () => {
    const visibleItems = filterStaffNavigationItems(items, null).map((item) => item.name);

    expect(visibleItems).toEqual(["Dashboard"]);
  });
});
