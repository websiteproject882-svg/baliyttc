import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'de', 'fr', 'id', 'ko', 'zh', 'ja', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  id: 'Bahasa Indonesia',
  ko: '한국어',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский',
};

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
