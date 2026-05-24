export function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");
}

export function buildPublicUrl(path = "/", locale = "en") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedLocale = locale.replace(/^\/|\/$/g, "") || "en";

  if (normalizedPath === "/") {
    return `${getPublicBaseUrl()}/${normalizedLocale}`;
  }

  return `${getPublicBaseUrl()}/${normalizedLocale}${normalizedPath}`;
}
