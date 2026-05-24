import { normalizeLocale, withLocalePath } from "./localized-path";

export function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");
}

export function buildPublicUrl(path = "/", locale = "en") {
  const localizedPath = withLocalePath(path, normalizeLocale(locale));
  return /^(https?:\/\/|mailto:|tel:)/i.test(localizedPath) ? localizedPath : `${getPublicBaseUrl()}${localizedPath}`;
}
