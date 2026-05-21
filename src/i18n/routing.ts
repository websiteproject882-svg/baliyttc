import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'de', 'ko', 'zh', 'ja', 'fr', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  de: 'Deutsch',
  ko: 'Korean',
  zh: 'Chinese',
  ja: 'Japanese',
  fr: 'Francais',
  ru: 'Russian',
};

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
