import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';

const countryLocaleMap: Record<string, Locale> = {
  AT: 'de',
  CH: 'de',
  DE: 'de',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  CO: 'es',
  FR: 'fr',
  BE: 'fr',
  KR: 'ko',
  JP: 'ja',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  RU: 'ru',
};

function localeFromAcceptLanguage(value: string | null): Locale | null {
  if (!value) return null;

  const preferred = value
    .split(',')
    .map((item) => item.trim().split(';')[0]?.split('-')[0])
    .find((item): item is Locale => Boolean(item && locales.includes(item as Locale)));

  return preferred || null;
}

export default function RootPage() {
  const requestHeaders = headers();
  const country = requestHeaders.get('x-vercel-ip-country') || requestHeaders.get('cf-ipcountry');
  const countryLocale = country ? countryLocaleMap[country.toUpperCase()] : null;
  const browserLocale = localeFromAcceptLanguage(requestHeaders.get('accept-language'));

  redirect(`/${countryLocale || browserLocale || defaultLocale}`);
}
