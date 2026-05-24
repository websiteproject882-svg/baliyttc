import { hasPermission, isAdminPanelRole } from "./rbac";

export type StaffNavigationAccessItem = {
  permission?: string | null;
  adminOnly?: boolean;
};

export function canUseAdminPanel(role?: string | null): boolean {
  return Boolean(role && (isAdminPanelRole(role) || role === "ADMIN" || role === "SUPER_ADMIN"));
}

export function filterStaffNavigationItems<T extends StaffNavigationAccessItem>(
  items: T[],
  role?: string | null,
): T[] {
  const hasAdminPanelAccess = canUseAdminPanel(role);

  return items.filter((item) => {
    if (item.adminOnly && !hasAdminPanelAccess) {
      return false;
    }

    return !item.permission || Boolean(role && hasPermission(role, item.permission));
  });
}
