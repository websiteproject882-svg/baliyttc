import { defaultLocale, locales, type Locale } from "../i18n/routing";

export function normalizeLocale(value?: string | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export function localeFromPathname(pathname?: string | null): Locale {
  const firstSegment = pathname?.split("/").filter(Boolean)[0];
  return normalizeLocale(firstSegment);
}

export function localeFromUrl(value?: string | null): Locale {
  if (!value) return defaultLocale;

  try {
    return localeFromPathname(new URL(value, "https://baliyttc.local").pathname);
  } catch {
    return defaultLocale;
  }
}

export function withLocalePath(path: string | undefined | null, locale?: string | null) {
  const normalizedLocale = normalizeLocale(locale);
  const target = path || "/";

  if (/^https?:\/\//i.test(target) || target.startsWith("mailto:") || target.startsWith("tel:")) {
    return target;
  }

  const cleanTarget = target.startsWith("/") ? target : `/${target}`;
  const firstSegment = cleanTarget.split("/")[1];

  if (locales.includes(firstSegment as Locale)) {
    return cleanTarget;
  }

  return `/${normalizedLocale}${cleanTarget === "/" ? "" : cleanTarget}`;
}
