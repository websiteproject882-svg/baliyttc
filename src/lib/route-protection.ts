export function getProtectedRouteRequirement(pathWithoutLocale: string) {
  if (pathWithoutLocale === "/admin/login" || pathWithoutLocale === "/staff/login") {
    return null;
  }

  if (pathWithoutLocale.startsWith("/api/admin")) {
    return "admin-panel" as const;
  }

  if (pathWithoutLocale.startsWith("/api/teacher")) {
    return "staff" as const;
  }

  if (pathWithoutLocale.startsWith("/api/app")) {
    return "student" as const;
  }

  if (pathWithoutLocale.startsWith("/admin")) {
    return "admin-panel" as const;
  }

  if (pathWithoutLocale === "/staff" || pathWithoutLocale.startsWith("/staff/") || pathWithoutLocale.startsWith("/app/teacher")) {
    return "staff" as const;
  }

  if (pathWithoutLocale === "/app" || pathWithoutLocale.startsWith("/app/")) {
    return "student" as const;
  }

  return null;
}
