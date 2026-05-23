import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'de', 'fr', 'id', 'ko', 'zh', 'ja', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  de: 'Deutsch',
  fr: 'Francais',
  id: 'Bahasa Indonesia',
  ko: 'Korean',
  zh: 'Chinese',
  ja: 'Japanese',
  ru: 'Russian',
};

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
