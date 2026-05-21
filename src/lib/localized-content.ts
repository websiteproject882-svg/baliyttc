import { defaultLocale, locales, type Locale } from "@/i18n/routing";

export type LocalizedCourseFields = Partial<{
  name: string;
  duration: string;
  summary: string;
  description: string;
  image: string;
}>;

export type CourseWithTranslations<T extends Record<string, unknown>> = T & {
  translations?: unknown;
};

export function normalizeLocale(value: string | null | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export function applyCourseTranslation<T extends Record<string, unknown>>(
  course: CourseWithTranslations<T>,
  locale: Locale,
): T {
  if (locale === defaultLocale || !course.translations || typeof course.translations !== "object") {
    return course as T;
  }

  const translations = course.translations as Record<string, LocalizedCourseFields>;
  const translated = translations[locale];
  if (!translated || typeof translated !== "object") {
    return course as T;
  }

  return {
    ...course,
    ...Object.fromEntries(
      Object.entries(translated).filter(([, value]) => typeof value === "string" && value.trim().length > 0),
    ),
  } as T;
}
