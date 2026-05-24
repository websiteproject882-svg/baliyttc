import { defaultLocale, locales, type Locale } from "../i18n/routing";

export function normalizeLocale(value?: string | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
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
