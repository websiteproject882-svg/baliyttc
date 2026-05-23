const STUDENT_SESSION_ROLES = new Set(["STUDENT"]);
const STAFF_SESSION_ROLES = new Set([
  "TEACHER",
  "SEO_EDITOR",
  "FINANCE_MANAGER",
  "COURSE_MANAGER",
]);

export function isSessionAllowedForAuthType(
  session: { authType?: string; role?: string } | null | undefined,
  authType: "admin" | "staff" | "student",
) {
  if (!session || session.authType !== authType) {
    return false;
  }

  const role = String(session.role || "");

  if (authType === "student") {
    return STUDENT_SESSION_ROLES.has(role);
  }

  if (authType === "staff") {
    return STAFF_SESSION_ROLES.has(role);
  }

  return role === "SUPER_ADMIN" || role === "ADMIN";
}
