export function getProtectedRouteRequirement(pathWithoutLocale: string) {
  if (pathWithoutLocale === "/admin/login" || pathWithoutLocale === "/staff/login") {
    return null;
  }

  if (pathWithoutLocale.startsWith("/admin")) {
    return "admin-panel" as const;
  }

  if (pathWithoutLocale.startsWith("/staff") || pathWithoutLocale.startsWith("/app/teacher")) {
    return "staff" as const;
  }

  if (pathWithoutLocale.startsWith("/app")) {
    return "student" as const;
  }

  return null;
}
