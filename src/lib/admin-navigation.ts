import { hasPermission } from "./rbac";

export type AdminNavAccess = {
  permission?: string;
  roles?: readonly string[];
};

export function canAccessAdminNavItem(role: string, access: AdminNavAccess = {}) {
  if (access.roles?.includes(role)) {
    return true;
  }

  if (access.roles && !access.permission) {
    return false;
  }

  if (!access.permission) {
    return true;
  }

  return hasPermission(role, access.permission);
}
