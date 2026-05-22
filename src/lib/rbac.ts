// RBAC permissions matrix shared between server routes and admin UI.

export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "STUDENT_MANAGER",
  "SEO_EDITOR",
  "FINANCE_MANAGER",
  "COURSE_MANAGER",
  "TEACHER",
] as const;

export const ADMIN_PANEL_ROLES = [
  "SUPER_ADMIN",
  "STUDENT_MANAGER",
  "SEO_EDITOR",
  "FINANCE_MANAGER",
  "COURSE_MANAGER",
] as const;

export const USER_ROLES = [
  "STUDENT",
  "TEACHER",
  "STAFF",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type AppRole = StaffRole | UserRole;

export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"], // All permissions
  STUDENT_MANAGER: [
    "students.view", "students.edit", "students.approve", "students.email",
    "leads.view", "leads.edit",
    "enrollments.view", "enrollments.approve", "enrollments.reject",
    "announcements.view", "announcements.create", "announcements.edit",
    "waitlist.view", "waitlist.edit",
    "certificates.view", "certificates.issue",
    "testimonials.view", "testimonials.approve",
    "communications.view", "communications.send",
    "analytics.partial",
  ],
  SEO_EDITOR: [
    "blog.view", "blog.create", "blog.edit", "blog.publish",
    "gallery.view", "gallery.upload", "gallery.approve", "gallery.delete",
    "testimonials.view", "testimonials.approve",
    "faq.view", "faq.edit",
    "bot.view", "bot.edit",
    "analytics.partial",
  ],
  FINANCE_MANAGER: [
    "payments.view", "payments.refund",
    "coupons.view", "coupons.create", "coupons.edit",
    "communications.view", "communications.send",
    "leads.view",
    "waitlist.view", "waitlist.edit",
    "analytics.revenue",
    "alumni.view", "alumni.edit",
  ],
  COURSE_MANAGER: [
    "courses.view", "courses.create", "courses.edit",
    "batches.view", "batches.create", "batches.edit",
    "accommodation.view", "accommodation.edit",
    "ceremonies.view", "ceremonies.create", "ceremonies.edit",
    "prearrival.view", "prearrival.edit",
    "teachers.view", "teachers.edit",
    "leads.view",
    "communications.view",
    "analytics.partial",
  ],
  TEACHER: [
    "schedule.view", "announcements.view", "announcements.create",
    "students.view_own_batch",
  ],
};

export function getPermissions(role: string): string[] {
  return PERMISSIONS[role] || [];
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = getPermissions(role);
  return perms.includes("*") || perms.includes(permission);
}

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function isAdminPanelRole(role: string): role is (typeof ADMIN_PANEL_ROLES)[number] {
  return ADMIN_PANEL_ROLES.includes(role as (typeof ADMIN_PANEL_ROLES)[number]);
}

export function getRoleHomePath(role: string): string {
  if (role === "TEACHER") {
    return "/app/teacher/dashboard";
  }

  if (isAdminPanelRole(role) || role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/admin/overview";
  }

  return "/app/dashboard";
}
