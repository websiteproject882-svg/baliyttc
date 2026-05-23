import { hasPermission } from "./rbac";

export type AdminNavAccess = {
  permission?: string;
  roles?: readonly string[];
};

export function canAccessAdminNavItem(role: string, access: AdminNavAccess = {}, permissions?: readonly string[]) {
  if (access.roles?.includes(role)) {
    return true;
  }

  if (access.roles && !access.permission) {
    return false;
  }

  if (!access.permission) {
    return true;
  }

  if (permissions) {
    return permissions.includes("*") || permissions.includes(access.permission);
  }

  return hasPermission(role, access.permission);
}
