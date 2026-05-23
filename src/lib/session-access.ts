import { ADMIN_PANEL_ROLES, STAFF_PORTAL_ROLES } from "./rbac";

const STUDENT_SESSION_ROLES = new Set<string>(["STUDENT"]);
const STAFF_SESSION_ROLES = new Set<string>(STAFF_PORTAL_ROLES);
export const ADMIN_PANEL_SESSION_ROLES = new Set<string>([...ADMIN_PANEL_ROLES, "ADMIN"]);

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
